// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract TEERegistry is Ownable {
    struct TEEEntry {
        bool registered;
        uint8 threshold;
        uint256 registeredAt;
    }

    mapping(bytes32 => mapping(address => TEEEntry)) public entries;
    mapping(bytes32 => address[]) public signers;
    mapping(bytes32 => uint8) public thresholds;

    event TEERegistered(bytes32 indexed codeHash, address indexed signerAddr, uint8 threshold);
    event TEERevoked(bytes32 indexed codeHash, address indexed signerAddr);

    constructor(address initialOwner) Ownable(initialOwner) {}

    function registerTEE(bytes32 codeHash, address signerAddr, uint8 threshold) external onlyOwner {
        require(signerAddr != address(0), "zero address");
        require(threshold >= 1, "threshold must be >= 1");
        require(!entries[codeHash][signerAddr].registered, "already registered");

        entries[codeHash][signerAddr] =
            TEEEntry({registered: true, threshold: threshold, registeredAt: block.timestamp});
        signers[codeHash].push(signerAddr);
        thresholds[codeHash] = threshold;

        emit TEERegistered(codeHash, signerAddr, threshold);
    }

    function revokeTEE(bytes32 codeHash, address signerAddr) external onlyOwner {
        require(entries[codeHash][signerAddr].registered, "not registered");
        entries[codeHash][signerAddr].registered = false;
        emit TEERevoked(codeHash, signerAddr);
    }

    function isRegistered(bytes32 codeHash, address signerAddr) external view returns (bool) {
        return entries[codeHash][signerAddr].registered;
    }

    function getThreshold(bytes32 codeHash) external view returns (uint8) {
        return thresholds[codeHash];
    }

    function getSigners(bytes32 codeHash) external view returns (address[] memory) {
        return signers[codeHash];
    }
}
