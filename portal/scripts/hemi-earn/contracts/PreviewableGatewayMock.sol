// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IPeggedToken} from "src/interfaces/vetro/IPeggedToken.sol";
import {ERC20Mock} from "src/mocks/ERC20Mock.sol";

/// @title PreviewableGatewayMock
/// @notice Drop-in replacement for `GatewayMock` that adds the
///         `previewWithdraw(tokenOut, amountOut)` view from the production
///         `IGateway` interface. The portal's `previewWithdraw` action
///         (see `packages/hemi-earn-actions/src/actions/public/previewWithdraw.ts`)
///         calls it to compute the pegged-token input needed to receive
///         exactly `amountOut` of `tokenOut` on redeem — the canonical
///         inverse of `previewRedeem`.
/// @dev Storage layout mirrors `GatewayMock.sol` byte-for-byte so a hot
///      `anvil_setCode` at GATEWAY_PROD preserves any storage already set
///      by the deploy (depositRateBps / redeemRateBps / fail flags).
///      Keep this file in sync if `GatewayMock.sol` changes.
contract PreviewableGatewayMock {
    using SafeERC20 for IERC20;

    ERC20Mock immutable peggedToken;

    uint256 public totalDepositedAssets;
    uint256 public totalRedeemedAssets;

    uint256 public depositRateBps = 100_00;
    uint256 public redeemRateBps = 100_00;

    bool public shouldFailDeposit;
    bool public shouldFailRedeem;

    // slot 5 — appended for PR #2013 (`fetchOraclePrices` reads
    // `gateway.treasury()`). Zero-valued after `anvil_setCode`; the setup
    // calls `setTreasury` post-alias so the field gets populated.
    address private _treasury;

    // slot 6+ — appended for the REMOTE_FAILED redeem UI test (spec §
    // ad_earnremotefailedui). Lets `redeem()` revert with 3 distinct
    // revert-reason shapes so the portal's failureReason decoder can be
    // exercised across its categories. `shouldFailRedeem` (slot 4) still
    // works as the legacy catch-all — `redeemFailureMode != NONE` takes
    // precedence over it.
    //   NONE      → no injected failure (legacy `shouldFailRedeem` decides)
    //   SLIPPAGE  → `Error(string)` with a slippage keyword → 'slippage'
    //   FEE       → custom error `InsufficientFee(uint256,uint256)` → 'gas'
    //   UNKNOWN   → `Error(string)` with no recognized keyword → 'unknown'
    enum RedeemFailureMode {
        NONE,
        SLIPPAGE,
        FEE,
        UNKNOWN
    }
    RedeemFailureMode public redeemFailureMode;
    error InsufficientFee(uint256 required, uint256 provided);

    constructor(address peggedToken_) {
        peggedToken = ERC20Mock(peggedToken_);
    }

    function treasury() external view returns (address) {
        return _treasury;
    }

    function setTreasury(address treasury_) external {
        _treasury = treasury_;
    }

    function deposit(
        address tokenIn_,
        uint256 amountIn_,
        uint256 /*minPeggedTokenOut_*/,
        address receiver_
    ) external returns (uint256) {
        if (shouldFailDeposit) revert("GatewayMock: deposit failed");
        IERC20(tokenIn_).safeTransferFrom(msg.sender, address(this), amountIn_);
        uint256 amountOut = (amountIn_ * depositRateBps) / 100_00;
        totalDepositedAssets += amountIn_;
        peggedToken.mint(receiver_, amountOut);
        return amountOut;
    }

    function redeem(
        address tokenOut_,
        uint256 peggedTokenIn_,
        uint256 /*minAmountOut_*/,
        address receiver_
    ) external returns (uint256) {
        // Prioritize the multi-shape failure mode so the REMOTE_FAILED test
        // can drive a specific decode category. Falls back to the legacy
        // boolean when NONE.
        if (redeemFailureMode == RedeemFailureMode.SLIPPAGE) {
            revert("insufficient output amount");
        }
        if (redeemFailureMode == RedeemFailureMode.FEE) {
            revert InsufficientFee(1e15, 5e14);
        }
        if (redeemFailureMode == RedeemFailureMode.UNKNOWN) {
            revert("boom");
        }
        if (shouldFailRedeem) revert("GatewayMock: redeem failed");
        IERC20(address(peggedToken)).safeTransferFrom(msg.sender, address(this), peggedTokenIn_);
        peggedToken.burn(peggedTokenIn_);
        uint256 amountOut = (peggedTokenIn_ * redeemRateBps) / 100_00;
        totalRedeemedAssets += amountOut;
        IERC20(tokenOut_).transfer(receiver_, amountOut);
        return amountOut;
    }

    function previewDeposit(address /*tokenIn_*/, uint256 amountIn_) external view returns (uint256) {
        return (amountIn_ * depositRateBps) / 100_00;
    }

    function previewRedeem(address /*tokenOut_*/, uint256 peggedTokenIn_) external view returns (uint256) {
        return (peggedTokenIn_ * redeemRateBps) / 100_00;
    }

    /// @notice Returns the minimum peggedToken input that yields at least
    ///         `amountOut_` of `tokenOut_` on `redeem`. Inverse of
    ///         `previewRedeem`, with ceiling division so the user is never
    ///         underpaid due to integer truncation.
    function previewWithdraw(address /*tokenOut_*/, uint256 amountOut_) external view returns (uint256) {
        if (redeemRateBps == 0) revert("GatewayMock: zero redeemRate");
        return (amountOut_ * 100_00 + redeemRateBps - 1) / redeemRateBps;
    }

    function PEGGED_TOKEN() external view returns (IPeggedToken) {
        return IPeggedToken(address(peggedToken));
    }

    function setDepositRateBps(uint256 bps) external {
        depositRateBps = bps;
    }

    function setRedeemRateBps(uint256 bps) external {
        redeemRateBps = bps;
    }

    function setShouldFailDeposit(bool fail) external {
        shouldFailDeposit = fail;
    }

    function setShouldFailRedeem(bool fail) external {
        shouldFailRedeem = fail;
    }

    /// @notice Set the redeem revert mode (used by the REMOTE_FAILED test to
    ///         exercise the portal's failureReason category decoder). Pass 0
    ///         to disable (falls back to legacy `shouldFailRedeem`).
    function setRedeemFailureMode(uint8 mode) external {
        redeemFailureMode = RedeemFailureMode(mode);
    }
}
