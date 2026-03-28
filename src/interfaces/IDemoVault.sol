// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IDemoVault {
    function executeTransfer(address token, address to, uint256 amount) external;
}
