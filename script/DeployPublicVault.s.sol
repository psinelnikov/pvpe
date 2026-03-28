// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {PublicVault} from "../src/PublicVault.sol";

contract DeployPublicVault is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address usdcToken = vm.envAddress("USDC_TOKEN_ADDRESS");
        address owner = vm.envAddress("OWNER_ADDRESS");
        address dailyRebalancer = vm.envAddress("DAILY_REBALANCER_ADDRESS");
        
        console.log("=== Public Vault Deployment ===");
        console.log("Deployer:", vm.addr(deployerKey));
        console.log("USDC Token:", usdcToken);
        console.log("Owner:", owner);
        console.log("Daily Rebalancer:", dailyRebalancer);
        console.log("");

        vm.startBroadcast(deployerKey);

        console.log("Deploying PublicVault...");
        PublicVault publicVault = new PublicVault(
            usdcToken,
            owner,
            dailyRebalancer
        );
        console.log("PublicVault:", address(publicVault));

        vm.stopBroadcast();

        console.log("");
        console.log("=== Deployment Complete ===");
        console.log("");
        console.log("Contract Address (Public Chain):");
        console.log("  PUBLIC_VAULT_ADDRESS=", address(publicVault));
        console.log("");
        console.log("Add this to your .env file:");
        console.log("PUBLIC_VAULT_ADDRESS=%s", vm.toString(address(publicVault)));
    }
}