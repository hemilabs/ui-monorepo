// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title LabeledERC20Mock
/// @notice Drop-in replacement for `ERC20Mock` whose only addition is a pair
///         of label storage slots so the portal can render the mock with a
///         human-readable `name()`/`symbol()` instead of the empty strings
///         the OZ `ERC20("", "")` constructor leaves behind. Used after PR
///         #1996 deletes `_constants/tokens.ts`, since the portal then falls
///         back to on-chain ERC-20 metadata for token rendering.
///
/// @dev Storage layout MUST match `ERC20Mock` through slot 4 so a hot-swap
///      via `anvil_setCode` preserves the underlying balances/allowances/
///      totalSupply that the running anvil already holds. The new label
///      strings live at slots 5+:
///        slot 0  _balances             (ERC20)
///        slot 1  _allowances           (ERC20)
///        slot 2  _totalSupply          (ERC20)
///        slot 3  _name (= "")          (ERC20)
///        slot 4  _symbol (= "")        (ERC20)
///        slot 5  _labelName            ← NEW
///        slot 6  _labelSymbol          ← NEW
///
///      `name()`/`symbol()` are overridden to return the label slots
///      directly — the inherited `_name`/`_symbol` are left empty by the
///      base constructor and never read.
///
///      Added later (for `pause-router.sh` claim/recover coverage):
///        slot 7  _transferRevert        ← NEW
///      When `_transferRevert == true`, `transfer`/`transferFrom` revert
///      with "LabeledERC20Mock: transfers paused". Used to simulate a
///      `Router.recoverDeposit` failure (its `_finalize` calls
///      `asset.safeTransfer`, which then reverts) without touching the
///      Router's own bytecode. Cleared by `setTransferRevert(false)`.
contract LabeledERC20Mock is ERC20 {
    string private _labelName;
    string private _labelSymbol;
    bool private _transferRevert;

    constructor() ERC20("", "") {}

    function name() public view override returns (string memory) {
        return _labelName;
    }

    function symbol() public view override returns (string memory) {
        return _labelSymbol;
    }

    /// @notice One-shot setter for the label pair. Public, no auth — this is
    ///         a sandbox mock; gate or remove if ever reused elsewhere.
    function setLabel(string calldata name_, string calldata symbol_) external {
        _labelName = name_;
        _labelSymbol = symbol_;
    }

    function burn(uint256 value) public virtual {
        _burn(msg.sender, value);
    }

    function mint(address to, uint256 value) public virtual {
        _mint(to, value);
    }

    function setTransferRevert(bool v_) external {
        _transferRevert = v_;
    }

    function transferRevert() external view returns (bool) {
        return _transferRevert;
    }

    function transfer(address to_, uint256 value_) public override returns (bool) {
        if (_transferRevert) revert("LabeledERC20Mock: transfers paused");
        return super.transfer(to_, value_);
    }

    function transferFrom(address from_, address to_, uint256 value_) public override returns (bool) {
        if (_transferRevert) revert("LabeledERC20Mock: transfers paused");
        return super.transferFrom(from_, to_, value_);
    }
}
