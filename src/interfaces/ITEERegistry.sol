// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ITEERegistry {
    function isRegistered(bytes32 codeHash, address signerAddr) external view returns (bool);
    function getThreshold(bytes32 codeHash) external view returns (uint8);
    function getSigners(bytes32 codeHash) external view returns (address[] memory);
}
