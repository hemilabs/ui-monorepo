// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Router} from "src/Router.sol";
import {CrossChainMessages} from "src/libs/CrossChainMessages.sol";

/// @dev Mirror of the entry points on `ToggleableAgent` we call. We need a
///      5-arg `receiveDepositRequest` (caller + operator carried through)
///      and the 4-arg AgentMock signature won't fit. Defining the interface
///      here keeps the selector explicit at the call site.
interface IToggleableAgent {
    function receiveDepositRequest(
        uint256 requestId_,
        address asset_,
        uint256 amount_,
        address caller_,
        address operator_
    ) external;
    function receiveRedeemRequest(
        uint256 requestId_,
        address caller_,
        address operator_,
        uint256 shares_,
        bool isInstant_
    ) external;
}

/// @title ToggleableRouter
/// @notice Drop-in replacement for `RouterMock` whose only deviation is a
///         non-zero `_quote` return so the portal exercises its "user pays
///         a LayerZero fee" code path (button shows `nativeFee`, tx is sent
///         with `value > 0`). Everything else — constructor, asset/share
///         immutables, `_send` short-circuit to the in-process Agent — is
///         byte-for-byte the same as `RouterMock.sol`.
/// @dev RouterMock's `_quote` is declared `internal pure override` without
///      `virtual`, which blocks `is RouterMock` from re-overriding it. We
///      mirror the file directly instead, extending `Router` like the mock
///      does. Keep this file in sync if `RouterMock.sol` changes.
contract ToggleableRouter is Router {
    IERC20 public immutable asset;
    IERC20 public immutable share;

    /// @dev Quoted LayerZero outbound fee returned to the portal. 0.001 ETH
    ///      (~$2–3 at typical prices), in the same order of magnitude as
    ///      real mainnet LZ quotes. Adjust here + rebuild to vary the value;
    ///      the portal reads this as `nativeFee` from `quoteDeposit` /
    ///      `quoteRedeem`.
    uint256 public constant MOCK_LZ_FEE = 0.001 ether;

    constructor(IERC20 asset_, IERC20 share_) Router(address(1), 1) {
        _transferOwnership(msg.sender);
        UsingLZStorage storage $lz = _getUsingLZStorage();
        $lz.lzPeerReceiveGas = 200_000;
        RouterStorage storage $r = _getRouterStorage();
        $r.nextRequestId = 1;
        $r.assetsData[address(asset_)] = AssetData({share: address(share_), remoteAsset: address(0), remoteShare: address(0), enabled: true});
        asset = asset_;
        share = share_;
    }

    function _quote(address, uint256, bytes memory, uint128, uint128) internal pure override returns (uint256) {
        return MOCK_LZ_FEE;
    }

    function _send(address token_, uint256 amount_, bytes memory msg_, uint128, uint256, address, uint128) internal override {
        IToggleableAgent agent = IToggleableAgent(
            address(uint160(uint256(_getUsingLZStorage().peerAddress)))
        );

        if (token_ == address(asset)) {
            // Carry caller_ + operator_ through to the Agent so they end up
            // in the request's stored msg (the one `Agent.cancel` reads back
            // via `CrossChainMessages.operator()` for the auth check).
            (uint256 id_, address caller_, address operator_, , ) = CrossChainMessages.decodeDepositRequest(msg_);
            asset.approve(address(agent), amount_);
            agent.receiveDepositRequest(id_, token_, amount_, caller_, operator_);
        } else if (token_ == address(share)) {
            (uint256 id_, address caller_, address operator_, , , bool isInstant_) = CrossChainMessages.decodeRedeemRequest(msg_);
            share.approve(address(agent), amount_);
            agent.receiveRedeemRequest(id_, caller_, operator_, amount_, isInstant_);
        }
    }

    function fulfillDepositRequest(uint256 id_, uint256 shares_) public {
        share.transferFrom(msg.sender, address(this), shares_);

        bytes memory _msg = CrossChainMessages.encodeRequestFulfillment(id_);
        _receive(address(share), shares_, _msg, 0);
    }

    function fulfillRedeemRequest(uint256 id_, uint256 assets_) public {
        asset.transferFrom(msg.sender, address(this), assets_);

        bytes memory _msg = CrossChainMessages.encodeRequestFulfillment(id_);
        _receive(address(asset), assets_, _msg, 0);
    }

    /// @notice Sandbox-only entry points for the cancellation leg of a failed
    ///         request. RouterMock collapses fulfill+cancel into a single
    ///         `fulfill*Request` method that hardcodes `encodeRequestFulfillment`,
    ///         so when `Agent.cancel(id)` rounds-trips through the in-process
    ///         peer in the mock, the Router decodes a FULFILL instead of a
    ///         CANCEL — the request never reaches `CANCELLED` and the Recover
    ///         CTA never appears. These two methods restore the cancel leg:
    ///         the Agent returns the original token (asset for DEPOSIT, share
    ///         for REDEEM) and the Router decodes `MSG_REQUEST_CANCEL` in
    ///         `_receive`, runs `_handleRequestCancel`, and transitions to
    ///         `CANCELLED`. Paired with the msgType-based routing in
    ///         `ToggleableAgent._send`.
    function cancelDepositRequest(uint256 id_, uint256 assets_) public {
        asset.transferFrom(msg.sender, address(this), assets_);

        bytes memory _msg = CrossChainMessages.encodeRequestCancel(id_);
        _receive(address(asset), assets_, _msg, 0);
    }

    function cancelRedeemRequest(uint256 id_, uint256 shares_) public {
        share.transferFrom(msg.sender, address(this), shares_);

        bytes memory _msg = CrossChainMessages.encodeRequestCancel(id_);
        _receive(address(share), shares_, _msg, 0);
    }
}
