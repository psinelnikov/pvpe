// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {TEERegistry} from "../src/TEERegistry.sol";
import {ActionGate} from "../src/ActionGate.sol";
import {PolicyRegistry} from "../src/PolicyRegistry.sol";
import {PrivacyVaultCoordinator} from "../src/PrivacyVaultCoordinator.sol";
import {IDemoVault} from "../src/interfaces/IDemoVault.sol";

contract DeployVaultInfra is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address usdcToken = vm.envAddress("USDC_TOKEN_ADDRESS");
        address owner = vm.envAddress("OWNER_ADDRESS");
        address dailyRebalancer = vm.envAddress("DAILY_REBALANCER_ADDRESS");
        
        console.log("=== Privacy Vault Infrastructure Deployment ===");
        console.log("Deployer:", vm.addr(deployerKey));
        console.log("USDC Token:", usdcToken);
        console.log("Owner:", owner);
        console.log("Daily Rebalancer:", dailyRebalancer);
        console.log("");

        vm.startBroadcast(deployerKey);

        console.log("1. Deploying TEERegistry...");
        TEERegistry teeRegistry = new TEERegistry(owner);
        console.log("   TEERegistry:", address(teeRegistry));

        console.log("2. Deploying DemoVault (for ActionGate)...");
        DemoVault demoVault = new DemoVault(owner);
        console.log("   DemoVault:", address(demoVault));

        console.log("3. Deploying ActionGate...");
        ActionGate actionGate = new ActionGate(owner, address(teeRegistry), address(demoVault));
        console.log("   ActionGate:", address(actionGate));

        console.log("4. Deploying PolicyRegistry...");
        PolicyRegistry policyRegistry = new PolicyRegistry(owner);
        console.log("   PolicyRegistry:", address(policyRegistry));

        console.log("5. Deploying PrivacyVaultCoordinator...");
        PrivacyVaultCoordinator privacyCoordinator = new PrivacyVaultCoordinator(usdcToken, owner);
        console.log("   PrivacyVaultCoordinator:", address(privacyCoordinator));

        console.log("6. Setting up PrivacyVaultCoordinator...");
        privacyCoordinator.setActionGate(address(actionGate));
        privacyCoordinator.setAuthorizedAgent(dailyRebalancer, true);
        console.log("   ActionGate set to:", address(actionGate));
        console.log("   Daily Rebalancer authorized:", dailyRebalancer);

        vm.stopBroadcast();

        console.log("");
        console.log("=== Deployment Complete ===");
        console.log("");
        console.log("Contract Addresses (Privacy Node):");
        console.log("  TEE_REGISTRY_ADDRESS       =", address(teeRegistry));
        console.log("  ACTION_GATE_ADDRESS        =", address(actionGate));
        console.log("  DEMO_VAULT_ADDRESS        =", address(demoVault));
        console.log("  POLICY_REGISTRY_ADDRESS     =", address(policyRegistry));
        console.log("  PRIVACY_COORDINATOR_ADDRESS=", address(privacyCoordinator));
        console.log("");
        console.log("Add these to your .env file:");
        console.log("TEE_REGISTRY_ADDRESS=%s", vm.toString(address(teeRegistry)));
        console.log("ACTION_GATE_ADDRESS=%s", vm.toString(address(actionGate)));
        console.log("DEMO_VAULT_ADDRESS=%s", vm.toString(address(demoVault)));
        console.log("POLICY_REGISTRY_ADDRESS=%s", vm.toString(address(policyRegistry)));
        console.log("PRIVACY_COORDINATOR_ADDRESS=%s", vm.toString(address(privacyCoordinator)));
    }
}

contract DemoVault is IDemoVault {
    address public owner;
    IERC20 public usdcToken;

    constructor(address _owner) {
        owner = _owner;
    }

    function executeTransfer(address token, address to, uint256 amount) external {
        require(msg.sender == owner, "Not authorized");
        IERC20(token).transfer(to, amount);
    }
}