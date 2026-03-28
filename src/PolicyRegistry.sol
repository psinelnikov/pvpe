// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract PolicyRegistry is Ownable {
    error ZeroPolicyId();
    error PolicyAlreadyExists();
    error PolicyNotFound();

    mapping(bytes32 => bytes32) public policyHashes;
    bytes32[] public policyIds;

    event PolicySet(bytes32 indexed policyId, bytes32 contentHash);
    event PolicyUpdated(bytes32 indexed policyId, bytes32 oldHash, bytes32 newHash);

    constructor(address _owner) Ownable(_owner) {}

    function setPolicyHash(bytes32 policyId, bytes32 contentHash) external onlyOwner {
        if (policyId == bytes32(0)) revert ZeroPolicyId();
        
        bytes32 oldHash = policyHashes[policyId];
        
        policyHashes[policyId] = contentHash;
        
        if (oldHash == bytes32(0)) {
            policyIds.push(policyId);
            emit PolicySet(policyId, contentHash);
        } else {
            emit PolicyUpdated(policyId, oldHash, contentHash);
        }
    }

    function getPolicyHash(bytes32 policyId) external view returns (bytes32) {
        bytes32 hash = policyHashes[policyId];
        if (hash == bytes32(0)) revert PolicyNotFound();
        return hash;
    }

    function policyExists(bytes32 policyId) external view returns (bool) {
        return policyHashes[policyId] != bytes32(0);
    }

    function getAllPolicyIds() external view returns (bytes32[] memory) {
        return policyIds;
    }
}