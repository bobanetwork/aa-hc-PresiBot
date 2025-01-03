// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../contracts/HybridAccount.sol";
import "../contracts/HybridAccountFactory.sol";
import "../contracts/HCHelper.sol";
import "@account-abstraction/contracts/core/EntryPoint.sol";
import "@account-abstraction/contracts/samples/SimpleAccountFactory.sol";
import "@account-abstraction/contracts/samples/TokenPaymaster.sol";
import "@account-abstraction/contracts/samples/VerifyingPaymaster.sol";
import "@account-abstraction/contracts/samples/VerifyingPaymaster.sol";
import "../contracts/PresiSimToken.sol";

contract DeployExample is Script {
    // Configs
    uint256 public deployerPrivateKey = vm.envUint("PRIVATE_KEY");
    address public deployerAddress;
    string public backendURL = vm.envString("BACKEND_URL");
    address public hcHelperAddr = vm.envAddress("HC_HELPER_ADDR");

    // Contracts
    address public entrypoint = vm.envAddress("ENTRY_POINT");
    address public haFactory = vm.envAddress("HA_FACTORY");

    HybridAccount public hybridAccount;
    IHCHelper public hcHelper;
    PresiSimToken public presiSimToken;
    TokenPaymaster public tokenPaymaster;

    function run() public {
        deployerAddress = vm.addr(deployerPrivateKey);
        vm.startBroadcast(deployerPrivateKey);

        // Init HCHelper
        hcHelper = IHCHelper(vm.envAddress("HC_HELPER_ADDR"));

        // Deploy using HybridAccountFactory, salt = block.number to force redeploy HybridAccount if already existing from this wallet
        hybridAccount = HybridAccountFactory(haFactory).createAccount(deployerAddress, block.number);
        console.log("Account created");
        console.log(address(hybridAccount));

        // Fund the account if needed
        if (address(hybridAccount).balance < 0.01 ether) {
            payable(address(hybridAccount)).transfer(
                0.01 ether - address(hybridAccount).balance
            );
        }
        console.log("Account Funded");
        console.log("Account Deposited");

        // Deploy PresiSimToken
        presiSimToken = new PresiSimToken(address(hybridAccount));
        console.log("PresiSim Token");

        // Register URL - done by the boba team
        // Important, add credits to the right contc!
        IERC20(0x4200000000000000000000000000000000000023).approve(address(hcHelper), 30000000000000000);
        hcHelper.AddCredit(address(hybridAccount), 5);
        // hcHelper.RegisterUrl(address(hybridAccount), backendURL);

        // Permit caller
        hybridAccount.PermitCaller(address(presiSimToken), true);
        console.log("Caller permitted");

        console.log("Hybrid Account Owner set to:");
        console.log(address(deployerAddress));

        // Verification logs
        console.log("\n=== Deployment Verification ===");
        console.log("HCHelper address:", address(hcHelper)); // that why the credits call fails?? goes to the wrong addr!
        console.log("HybridAccount address:", address(hybridAccount));
        console.log("PresiSimToken address:", address(presiSimToken));
        console.log("Deployer address:", deployerAddress);

        // Try to get and log the owner of HybridAccount
        try hybridAccount.owner() returns (address owner) {
            console.log("HybridAccount owner:", owner);
        } catch {
            console.log("Could not fetch HybridAccount owner");
        }

        // Verify PresiSimToken ownership
        try presiSimToken.owner() returns (address owner) {
            console.log("PresiSimToken owner:", owner);
        } catch {
            console.log("Could not fetch PresiSimToken owner");
        }

        // Check account balance
        console.log("HybridAccount balance:", address(hybridAccount).balance);

        vm.stopBroadcast();
    }
}