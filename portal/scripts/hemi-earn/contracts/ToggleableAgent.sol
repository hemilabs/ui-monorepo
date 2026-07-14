// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Agent} from "src/Agent.sol";
import {IStakingVault} from "src/interfaces/vetro/IStakingVault.sol";
import {CrossChainMessages} from "src/libs/CrossChainMessages.sol";
import {MSG_REQUEST_FULFILL, MSG_REQUEST_CANCEL} from "src/types/Constants.sol";

/// @dev Mirrors the four sandbox-only entry points on `ToggleableRouter`.
///      Importing the contract directly would either create a circular dep
///      (Router file already imports `AgentMock`) or force us to keep
///      RouterMock as the cast target — which doesn't declare the cancel
///      methods. Defining the interface here keeps the selector surface
///      explicit at the call site.
interface IToggleableRouter {
    function fulfillDepositRequest(uint256 id_, uint256 shares_) external;
    function fulfillRedeemRequest(uint256 id_, uint256 assets_) external;
    function cancelDepositRequest(uint256 id_, uint256 assets_) external;
    function cancelRedeemRequest(uint256 id_, uint256 shares_) external;
}

/// @title ToggleableAgent
/// @notice Drop-in replacement for AgentMock that adds a `delayed` mode so the
///         relayer (scripts/relayer.sh, src/relayer.ts) can recreate the
///         cross-chain "PENDING → CLAIMED" gap that the synchronous AgentMock
///         collapses into a single transaction. Default is `delayed = false`,
///         which behaves byte-for-byte like AgentMock (instant fulfillment).
/// @dev Storage layout:
///         - `asset`, `staking`: immutables, baked into the runtime bytecode.
///         - `isVault`, `delayed`, `buffered`: regular contract storage.
///         - The base `Agent` and `UsingLZ` use ERC-7201 namespaced storage,
///           so they do not collide with anything declared here.
contract ToggleableAgent is Agent {
    IERC20 public immutable asset;
    IStakingVault public immutable staking;
    mapping(address vault => bool) public isVault;

    /// @notice Toggles between sync mode (instant fulfillment, like AgentMock)
    ///         and delayed mode (`receiveX` buffers, relayer drives
    ///         `processBuffered`). Default `false` so the sandbox keeps its
    ///         existing fast happy-path until the operator opts in.
    bool public delayed;

    /// @dev `kind == 0` is a deposit, `kind == 1` is a redeem. `processed`
    ///      guards against double-processing. `isInstant` is only meaningful
    ///      for redeems (kind == 1) and carries the original caller's choice
    ///      forward through the buffer so `processBuffered` can re-encode the
    ///      cross-chain message identically.
    struct BufferedRequest {
        address token;
        uint256 amount;
        address caller;
        address operator;
        uint8 kind;
        bool isInstant;
        bool processed;
    }
    mapping(uint256 requestId => BufferedRequest) public buffered;

    /// @notice Emitted when a request is stored for later processing
    ///         (delayed mode only). Useful for the off-chain relayer to
    ///         double-check it caught everything via Router events.
    event RequestBuffered(uint256 indexed requestId);

    /// @notice Emitted when a previously buffered request has been pushed
    ///         through the regular Agent flow.
    event RequestProcessed(uint256 indexed requestId);

    constructor(IERC20 asset_, IStakingVault staking_) Agent(address(1), 1) {
        _transferOwnership(msg.sender);
        UsingLZStorage storage $lz = _getUsingLZStorage();
        $lz.lzPeerReceiveGas = 200_000;
        // `lzPeerComposeGas` is gone from `UsingLZStorage` after the contract
        // refactor (composeGas now travels per-tx on the `_send` signature
        // below); the previous setter was harmless but the field no longer
        // exists, so we drop it.
        asset = asset_;
        staking = staking_;
        isVault[address(staking_)] = true;
    }

    /// @notice Owner-only toggle for the delay mode. Buffered requests are
    ///         NOT auto-flushed when switching back to sync — call
    ///         `processBuffered(id)` (or let the relayer continue draining)
    ///         to settle them.
    function setDelayed(bool delayed_) external onlyOwner {
        delayed = delayed_;
    }

    function receiveDepositRequest(
        uint256 requestId_,
        address,
        uint256 assets_,
        address caller_,
        address operator_
    ) public {
        // Always pull the tokens in synchronously — they sit in this Agent's
        // balance while the request waits, exactly mirroring what AgentMock
        // does in sync mode.
        asset.transferFrom(msg.sender, address(this), assets_);

        if (delayed) {
            buffered[requestId_] = BufferedRequest({
                token: address(asset),
                amount: assets_,
                caller: caller_,
                operator: operator_,
                kind: 0,
                isInstant: false,
                processed: false
            });
            emit RequestBuffered(requestId_);
            return;
        }

        // Carry the original caller + operator into the encoded msg. Without
        // this, the bytes that ends up in `Agent.failedRequests[id].msg` has
        // operator=address(0), which makes `Agent.cancel(id)` revert with
        // `InvalidSender` for every caller except a registered keeper.
        bytes memory _msg = CrossChainMessages.encodeDepositRequest(
            requestId_,
            caller_,
            operator_,
            address(staking),
            0
        );
        _receive(address(asset), assets_, _msg, 0);
    }

    function receiveRedeemRequest(
        uint256 requestId_,
        address caller_,
        address operator_,
        uint256 shares_,
        bool isInstant_
    ) public {
        IERC20(address(staking)).transferFrom(msg.sender, address(this), shares_);

        if (delayed) {
            buffered[requestId_] = BufferedRequest({
                token: address(staking),
                amount: shares_,
                caller: caller_,
                operator: operator_,
                kind: 1,
                isInstant: isInstant_,
                processed: false
            });
            emit RequestBuffered(requestId_);
            return;
        }

        bytes memory _msg = CrossChainMessages.encodeRedeemRequest(
            requestId_,
            caller_,
            operator_,
            address(asset),
            0,
            isInstant_
        );
        _receive(address(staking), shares_, _msg, 0);
    }

    /// @notice Pushes a previously buffered request through the regular
    ///         Agent flow (gateway → staking → fulfillment back to the
    ///         Router). Permissionless — the relayer typically calls this
    ///         after sleeping `RELAYER_DELAY` seconds.
    function processBuffered(uint256 requestId_) external {
        BufferedRequest storage b = buffered[requestId_];
        require(b.token != address(0), "ToggleableAgent: not buffered");
        require(!b.processed, "ToggleableAgent: already processed");
        b.processed = true;

        bytes memory _msg;
        if (b.kind == 0) {
            _msg = CrossChainMessages.encodeDepositRequest(
                requestId_,
                b.caller,
                b.operator,
                address(staking),
                0
            );
        } else {
            _msg = CrossChainMessages.encodeRedeemRequest(
                requestId_,
                b.caller,
                b.operator,
                address(asset),
                0,
                b.isInstant
            );
        }
        _receive(b.token, b.amount, _msg, 0);

        emit RequestProcessed(requestId_);
    }

    /// @dev Quoted LayerZero callback fee returned by
    ///      `Agent.quoteDepositFulfillment` / `quoteRedeemFulfillment`. The
    ///      portal feeds this into `requestDeposit`/`requestRedeem` as the
    ///      `callbackFee_` arg so the user covers the return leg
    ///      Ethereum→Hemi. 0.0005 ETH — deliberately *different* from
    ///      `ToggleableRouter.MOCK_LZ_FEE` so the two contributions are
    ///      distinguishable in the UI.
    uint256 public constant MOCK_CALLBACK_FEE = 0.0005 ether;

    /// @dev Quoted LayerZero fee for the CANCEL outbound message. In
    ///      production this is quoted separately from the fulfillment fee
    ///      (different message payload, different destination gas budget).
    ///      Set to a DIFFERENT value than `MOCK_CALLBACK_FEE` so a UI that
    ///      accidentally passes `quoteRedeemFulfillment(...)` into a cancel
    ///      call under-funds and hits `InsufficientFee` — the exact bug the
    ///      REMOTE_FAILED redeem UI test wants to catch. Active only when
    ///      `strictFeeCheck = true`; the default mock ignores fees.
    uint256 public constant MOCK_CANCEL_FEE = 0.0007 ether;

    // `InsufficientFee(uint256 provided, uint256 required)` is inherited
    // from `UsingLZ.sol` — reuse it so we don't shadow / mismatch selector.

    /// @notice When true, `_send` enforces `msg.value ≥ MOCK_{CALLBACK,CANCEL}_FEE`
    ///         based on the message type. Default false (mock ignores fee).
    ///         The REMOTE_FAILED test flips this on to verify the portal's
    ///         cancel-value calc actually covers the cancel outbound.
    bool public strictFeeCheck;

    function setStrictFeeCheck(bool v_) external {
        strictFeeCheck = v_;
    }

    // `composeGas_` (5th param) was added by the contract refactor that
    // moved per-call lzCompose gas out of `UsingLZStorage`.
    function _quote(
        address,
        uint256,
        bytes memory,
        uint128,
        uint128
    ) internal pure override returns (uint256) {
        return MOCK_CALLBACK_FEE;
    }

    // Same refactor added a 7th `uint128 composeGas_` to `_send` — ignored
    // here because the mock loops straight back through the in-process
    // Router/Agent pair without going through LayerZero.
    function _send(
        address token_,
        uint256 amount_,
        bytes memory msg_,
        uint128,
        uint256 nativeFee_,
        address,
        uint128
    ) internal override {
        IToggleableRouter router = IToggleableRouter(
            address(uint160(uint256(_getUsingLZStorage().peerAddress)))
        );

        IERC20(token_).approve(address(router), amount_);

        uint8 _msgType = CrossChainMessages.msgType(msg_);

        if (strictFeeCheck) {
            uint256 required = _msgType == MSG_REQUEST_CANCEL
                ? MOCK_CANCEL_FEE
                : MOCK_CALLBACK_FEE;
            // Note: UsingLZ error signature is (provided, required).
            if (nativeFee_ < required) revert InsufficientFee(nativeFee_, required);
        }

        if (_msgType == MSG_REQUEST_FULFILL) {
            uint256 id_ = CrossChainMessages.decodeRequestFulfillment(msg_);
            if (isVault[token_]) router.fulfillDepositRequest(id_, amount_);
            else router.fulfillRedeemRequest(id_, amount_);
        } else if (_msgType == MSG_REQUEST_CANCEL) {
            // Token mirroring inverts vs fulfill: cancel of a DEPOSIT returns
            // the original ASSET (token=asset, !isVault); cancel of a REDEEM
            // returns the original SHARE (token=share, isVault).
            uint256 id_ = CrossChainMessages.decodeRequestCancel(msg_);
            if (isVault[token_]) router.cancelRedeemRequest(id_, amount_);
            else router.cancelDepositRequest(id_, amount_);
        }
    }
}
