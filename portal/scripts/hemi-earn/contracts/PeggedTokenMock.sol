// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Minimal IPeggedToken-compatible mock: exposes a `gateway()` getter so
// `Agent.handleDepositRequest` can resolve the Gateway via the pegged token
// (see hemi-earn/packages/contracts/src/Agent.sol:96-97).
contract PeggedTokenMock is ERC20 {
    address public gateway;

    constructor() ERC20("vetBTC mock", "vetBTC") {}

    function setGateway(address g) external {
        gateway = g;
    }

    function mint(address to, uint256 v) external {
        _mint(to, v);
    }

    function burn(uint256 v) external {
        _burn(msg.sender, v);
    }
}
