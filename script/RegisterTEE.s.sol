// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {TEERegistry} from "../src/TEERegistry.sol";

contract RegisterTEE is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address teeRegistryAddr = vm.envAddress("TEE_REGISTRY_ADDRESS");
        bytes32 codeHash = vm.envBytes32("FCC_CODE_HASH");
        address signerAddr = vm.envAddress("TEE_SIGNER_ADDRESS");
        uint8 threshold = uint8(vm.envUint("TEE_THRESHOLD"));
        
        console.log("=== TEE Registration ===");
        console.log("TEE Registry:", teeRegistryAddr);
        console.log("Code Hash:", vm.toString(codeHash));
        console.log("Signer Address:", signerAddr);
        console.log("Threshold:", threshold);
        console.log("");

        vm.startBroadcast(deployerKey);

        TEERegistry teeRegistry = TEERegistry(teeRegistryAddr);

        console.log("Registering TEE...");
        teeRegistry.registerTEE(codeHash, signerAddr, threshold);
        console.log("TEE registered successfully!");

        vm.stopBroadcast();

        console.log("");
        console.log("=== Verification ===");
        bool isRegistered = teeRegistry.isRegistered(codeHash, signerAddr);
        uint8 storedThreshold = teeRegistry.getThreshold(codeHash);
        console.log("Is Registered:", isRegistered);
        console.log("Threshold:", storedThreshold);
        
        require(isRegistered, "TEE registration failed verification");
        require(storedThreshold == threshold, "Threshold mismatch");
    }
}