// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IActionGate {
    struct Permit {
        bytes32 intentHash;
        bytes32 policyHash;
        bytes32 codeHash;
        uint8 decisionStatus;
        bytes32 decisionHash;
        uint256 expiry;
        bytes32 nonce;
        bytes teeSignature;
    }

    struct ApprovalSig {
        address approver;
        bytes signature;
    }

    struct ExecuteParams {
        Permit permit;
        ApprovalSig[] approvalSigs;
        address token;
        address to;
        uint256 amount;
    }

    function executeWithPermit(ExecuteParams calldata params) external;
    
    function verifyPermit(Permit calldata p) external view returns (bool);
}