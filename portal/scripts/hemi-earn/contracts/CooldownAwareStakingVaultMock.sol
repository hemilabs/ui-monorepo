// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;

import {ERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ERC4626, IERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {IStakingVault} from "src/interfaces/vetro/IStakingVault.sol";

/// @title CooldownAwareStakingVaultMock
/// @notice Drop-in replacement for `StakingVaultMock` that tracks
///         `_totalAssetsInCooldown` and excludes it from `totalAssets()`.
///         Without this, `requestRedeem` burns shares while leaving the
///         underlying tokens in the vault — the OZ ERC4626 share-price
///         formula inflates over successive cooldowns, eventually forcing
///         the "inflation defense" path (`totalSupply=0` + non-zero
///         `totalAssets`) that rejects any new deposit smaller than the
///         residual. Production Vetro vaults override `totalAssets()` the
///         same way; the original mock left `totalAssetsInCooldown()` as a
///         stub returning 0.
///
/// @dev Storage layout MUST match `StakingVaultMock` byte-for-byte through
///      slot 12. The new `_totalAssetsInCooldown` is appended at slot 13.
///      Verified via `forge inspect StakingVaultMock storage`:
///        slot  0  _balances                (ERC20)
///        slot  1  _allowances              (ERC20)
///        slot  2  _totalSupply             (ERC20)
///        slot  3  _name                    (ERC20)
///        slot  4  _symbol                  (ERC20)
///        slot  5  totalSharesMinted        (ERC4626Mock-style counter)
///        slot  6  totalSharesBurned        (ERC4626Mock-style counter)
///        slot  7  _instantWithdrawWhitelist
///        slot  8  _cooldownRequests
///        slot  9  _sharesPerRequest
///        slot 10  _nextRequestId
///        slot 11  _cooldownDuration
///        slot 12  _cooldownEnabled (1B) + _owner (20B) packed
///        slot 13  _totalAssetsInCooldown   ← NEW
///
///      Keep these slots in this exact order. ERC4626Mock is re-inlined
///      rather than inherited so its `totalSharesMinted`/`totalSharesBurned`
///      sit in their original slots (5/6) and nothing shifts.
contract CooldownAwareStakingVaultMock is ERC4626, IStakingVault {
    using SafeERC20 for IERC20;

    // slot 5 — preserved from ERC4626Mock
    uint256 public totalSharesMinted;
    // slot 6 — preserved from ERC4626Mock
    uint256 public totalSharesBurned;

    // slot 7+ — preserved from StakingVaultMock
    mapping(address => bool) private _instantWithdrawWhitelist;
    mapping(uint256 => IStakingVault.CooldownRequest) private _cooldownRequests;
    mapping(uint256 => uint256) private _sharesPerRequest;
    uint256 private _nextRequestId;
    uint256 private _cooldownDuration;
    bool private _cooldownEnabled;
    address private _owner;

    // slot 13 — NEW: assets that have been promised to in-cooldown redeemers
    // but are still physically in the vault. Excluded from totalAssets so
    // the share price stays anchored even when shares are burned ahead of
    // their asset transfer.
    uint256 private _totalAssetsInCooldown;

    // slot 14 — added for `pause-router.sh` claim-coverage. When `true`,
    // `transfer`/`transferFrom` revert. `Router.claimDeposit`'s `_finalize`
    // calls `share.safeTransfer(receiver, shares)` — flipping this on makes
    // the user-signed claim tx revert on chain, so the portal's CTA stays
    // active for a retry. Cleared by `setTransferRevert(false)`.
    bool private _transferRevert;

    constructor(IERC20 asset_) ERC20("", "") ERC4626(asset_) {
        _owner = msg.sender;
    }

    // ── ERC4626 / ERC20 overrides ─────────────────────────────────────────

    /// @dev Live assets only — excludes anything reserved for in-flight
    ///      cooldown redeems. Mirrors production Vetro vault behaviour.
    function totalAssets() public view override(ERC4626, IERC4626) returns (uint256) {
        uint256 _bal = IERC20(asset()).balanceOf(address(this));
        return _bal > _totalAssetsInCooldown ? _bal - _totalAssetsInCooldown : 0;
    }

    function burn(uint256 value) public virtual {
        _burn(msg.sender, value);
    }

    function mint(address to, uint256 value) public virtual {
        _mint(to, value);
    }

    function deposit(uint256 assets, address receiver) public override(ERC4626, IERC4626) returns (uint256 shares) {
        shares = super.deposit(assets, receiver);
        totalSharesMinted += shares;
    }

    function redeem(uint256 shares, address receiver, address owner_) public override(ERC4626, IERC4626) returns (uint256 assets) {
        assets = super.redeem(shares, receiver, owner_);
        totalSharesBurned += shares;
    }

    // ── configurable state ────────────────────────────────────────────────

    function cooldownEnabled() external view override returns (bool) {
        return _cooldownEnabled;
    }

    function instantWithdrawWhitelist(address account_) external view override returns (bool) {
        return _instantWithdrawWhitelist[account_];
    }

    function updateCooldownEnabled(bool enabled_) external override {
        _cooldownEnabled = enabled_;
    }

    function updateInstantWithdrawWhitelist(address account_, bool status_) external override {
        _instantWithdrawWhitelist[account_] = status_;
    }

    // ── cooldown request flow ─────────────────────────────────────────────

    function requestRedeem(
        uint256 shares_,
        address owner_
    ) external override returns (uint256 requestId, uint256 assets) {
        if (owner_ != msg.sender) _spendAllowance(owner_, msg.sender, shares_);
        assets = previewRedeem(shares_);
        _burn(owner_, shares_);
        totalSharesBurned += shares_;

        requestId = _nextRequestId++;
        _cooldownRequests[requestId] = IStakingVault.CooldownRequest({
            owner: msg.sender,
            assets: assets,
            claimableAt: block.timestamp + _cooldownDuration
        });
        _sharesPerRequest[requestId] = shares_;
        _totalAssetsInCooldown += assets;
    }

    function claimWithdraw(uint256 requestId_, address receiver_) external override returns (uint256 assets) {
        IStakingVault.CooldownRequest memory req = _cooldownRequests[requestId_];
        delete _cooldownRequests[requestId_];
        delete _sharesPerRequest[requestId_];
        assets = req.assets;
        _totalAssetsInCooldown = _totalAssetsInCooldown >= assets
            ? _totalAssetsInCooldown - assets
            : 0;
        IERC20(asset()).safeTransfer(receiver_, assets);
    }

    function nextRequestId() external view override returns (uint256) {
        return _nextRequestId;
    }

    function getRequestDetails(
        uint256 requestId_
    ) external view override returns (IStakingVault.CooldownRequest memory) {
        return _cooldownRequests[requestId_];
    }

    function owner() external view override returns (address) {
        return _owner;
    }

    function cancelWithdraw(uint256 requestId_) external override returns (uint256 shares) {
        IStakingVault.CooldownRequest memory req = _cooldownRequests[requestId_];
        shares = _sharesPerRequest[requestId_];
        delete _cooldownRequests[requestId_];
        delete _sharesPerRequest[requestId_];
        _totalAssetsInCooldown = _totalAssetsInCooldown >= req.assets
            ? _totalAssetsInCooldown - req.assets
            : 0;
        _mint(req.owner, shares);
    }

    function claimWithdrawBatch(uint256[] calldata, address) external pure override returns (uint256) {
        return 0;
    }

    function cooldownDuration() external view override returns (uint256) {
        return _cooldownDuration;
    }

    function getActiveRequestIds(address) external pure override returns (uint256[] memory) {
        return new uint256[](0);
    }

    function getClaimableRequests(address) external pure override returns (uint256[] memory, uint256[] memory) {
        return (new uint256[](0), new uint256[](0));
    }

    function getPendingRequests(
        address
    ) external pure override returns (uint256[] memory, uint256[] memory, uint256[] memory) {
        return (new uint256[](0), new uint256[](0), new uint256[](0));
    }

    function requestWithdraw(uint256, address) external pure override returns (uint256, uint256) {
        return (0, 0);
    }

    function totalAssetsInCooldown() external view override returns (uint256) {
        return _totalAssetsInCooldown;
    }

    function updateCooldownDuration(uint256 duration_) external override {
        _cooldownDuration = duration_;
    }

    function updateVaultRewards(address) external override {}

    function updateYieldDistributor(address) external override {}

    function vaultRewards() external pure override returns (address) {
        return address(0);
    }

    function yieldDistributor() external pure override returns (address) {
        return address(0);
    }

    // ── sandbox-only helpers ──────────────────────────────────────────────

    /// @dev One-off backfill for `_totalAssetsInCooldown` after a hot-swap
    ///      onto a vault whose existing `_cooldownRequests` predate this
    ///      contract version. Public, no auth — it's a sandbox. Remove (or
    ///      gate) if this contract is ever used outside the anvil setup.
    function __setTotalAssetsInCooldown(uint256 value_) external {
        _totalAssetsInCooldown = value_;
    }

    /// @dev Direct asset transfer out of the vault, bypassing the share
    ///      accounting. Used by recovery scripts to drain residual balance
    ///      when the previous (buggy) mock left the vault in an inconsistent
    ///      state. Public, no auth — sandbox only.
    function __drain(address to_, uint256 amount_) external {
        IERC20(asset()).safeTransfer(to_, amount_);
    }

    function setTransferRevert(bool v_) external {
        _transferRevert = v_;
    }

    function transferRevert() external view returns (bool) {
        return _transferRevert;
    }

    function transfer(address to_, uint256 value_)
        public
        override(ERC20, IERC20)
        returns (bool)
    {
        if (_transferRevert) revert("CooldownAwareStakingVaultMock: transfers paused");
        return super.transfer(to_, value_);
    }

    function transferFrom(address from_, address to_, uint256 value_)
        public
        override(ERC20, IERC20)
        returns (bool)
    {
        if (_transferRevert) revert("CooldownAwareStakingVaultMock: transfers paused");
        return super.transferFrom(from_, to_, value_);
    }
}
