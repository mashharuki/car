// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockERC20
 * @notice Testing token with public minting capability
 */
contract MockERC20 is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}

    /**
     * @notice Mint tokens to specific address
     * @param to Target address
     * @param amount Token amount
     */
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}
