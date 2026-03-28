// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ITEERegistry} from "./interfaces/ITEERegistry.sol";
import {IDemoVault} from "./interfaces/IDemoVault.sol";

contract ActionGate is Ownable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    ITEERegistry public registry;
    IDemoVault public vault;

    mapping(bytes32 => mapping(bytes32 => bool)) public usedNonces;
    mapping(address => bool) public approvers;

    event DecisionVerified(
        bytes32 indexed intentHash,
        bytes32 indexed policyHash,
        bytes32 indexed codeHash,
        bytes32 decisionHash,
        uint8 decisionStatus
    );
    event ApprovalUsed(bytes32 indexed decisionHash, address indexed approver);
    event ActionExecuted(bytes32 indexed intentHash, address indexed to, uint256 amount, address token);
    event ApproverSet(address indexed approver, bool status);

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

    error PermitExpired(uint256 expiry, uint256 blockTimestamp);
    error NonceUsed(bytes32 nonce);
    error DecisionDenied();
    error UnregisteredCodeHash(bytes32 codeHash, address recovered);
    error InvalidTEESignature();
    error InsufficientApprovals(uint256 got, uint256 required);
    error InvalidApprover(address approver);
    error InvalidApprovalSignature(address approver);
    error DecisionHashMismatch();

    constructor(address initialOwner, address _registry, address _vault) Ownable(initialOwner) {
        registry = ITEERegistry(_registry);
        vault = IDemoVault(_vault);
    }

    function executeWithPermit(ExecuteParams calldata params) external {
        Permit calldata p = params.permit;

        if (block.timestamp > p.expiry) {
            revert PermitExpired(p.expiry, block.timestamp);
        }

        if (usedNonces[p.intentHash][p.nonce]) {
            revert NonceUsed(p.nonce);
        }

        if (p.decisionStatus == 1) revert DecisionDenied();

        bytes32 expectedDecisionHash =
            _computeDecisionHash(p.intentHash, p.policyHash, p.codeHash, p.decisionStatus, p.expiry, p.nonce);
        if (expectedDecisionHash != p.decisionHash) revert DecisionHashMismatch();

        address recovered = p.decisionHash.toEthSignedMessageHash().recover(p.teeSignature);
        if (!registry.isRegistered(p.codeHash, recovered)) {
            revert UnregisteredCodeHash(p.codeHash, recovered);
        }

        if (p.decisionStatus == 2) {
            uint8 required = registry.getThreshold(p.codeHash);
            _verifyApprovals(p.decisionHash, params.approvalSigs, required);
        }

        usedNonces[p.intentHash][p.nonce] = true;

        emit DecisionVerified(p.intentHash, p.policyHash, p.codeHash, p.decisionHash, p.decisionStatus);

        vault.executeTransfer(params.token, params.to, params.amount);

        emit ActionExecuted(p.intentHash, params.to, params.amount, params.token);
    }

    function _computeDecisionHash(
        bytes32 intentHash,
        bytes32 policyHash,
        bytes32 codeHash,
        uint8 decisionStatus,
        uint256 expiry,
        bytes32 nonce
    ) internal pure returns (bytes32) {
        return keccak256(
            abi.encode(
                keccak256(
                    "Decision(bytes32 intentHash,bytes32 policyHash,bytes32 codeHash,uint8 decisionStatus,uint256 expiry,bytes32 nonce)"
                ),
                intentHash,
                policyHash,
                codeHash,
                decisionStatus,
                expiry,
                nonce
            )
        );
    }

    function _verifyApprovals(bytes32 decisionHash, ApprovalSig[] calldata sigs, uint8 required) internal {
        uint256 valid = 0;
        for (uint256 i = 0; i < sigs.length; i++) {
            if (!approvers[sigs[i].approver]) {
                revert InvalidApprover(sigs[i].approver);
            }
            bytes32 approvalHash = keccak256(abi.encode(decisionHash, sigs[i].approver));
            address recovered = approvalHash.toEthSignedMessageHash().recover(sigs[i].signature);
            if (recovered != sigs[i].approver) {
                revert InvalidApprovalSignature(sigs[i].approver);
            }
            emit ApprovalUsed(decisionHash, sigs[i].approver);
            valid++;
        }
        if (valid < required) revert InsufficientApprovals(valid, required);
    }

    function setApprover(address approver, bool status) external onlyOwner {
        approvers[approver] = status;
        emit ApproverSet(approver, status);
    }

    function setRegistry(address _registry) external onlyOwner {
        registry = ITEERegistry(_registry);
    }

    function setVault(address _vault) external onlyOwner {
        vault = IDemoVault(_vault);
    }

    function verifyPermit(Permit calldata p) external view returns (bool) {
        if (block.timestamp > p.expiry) return false;
        if (usedNonces[p.intentHash][p.nonce]) return false;
        if (p.decisionStatus == 1) return false;
        bytes32 expectedHash =
            _computeDecisionHash(p.intentHash, p.policyHash, p.codeHash, p.decisionStatus, p.expiry, p.nonce);
        if (expectedHash != p.decisionHash) return false;
        address recovered = p.decisionHash.toEthSignedMessageHash().recover(p.teeSignature);
        return registry.isRegistered(p.codeHash, recovered);
    }
}
