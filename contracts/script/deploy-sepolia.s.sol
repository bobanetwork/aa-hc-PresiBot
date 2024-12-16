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
    string public backendURL = vm.envString("BACKEND_URL"); // default backend for boba sepolia
    address public hcHelperAddr = vm.envAddress("HC_HELPER_ADDR"); // System-wide HCHelper

    // Contracts
    address public entrypoint = vm.envAddress("ENTRY_POINT"); // system wide
    //  address public haFactory = address(0x3DD6EE2e539CCd7EaB881173fB704f766e877848); // System-wide Account factory, prior ?
    address public haFactory = address(0x3433dc75A422Cf5DE675dc9C5CCc9f8a18B9Ea4F); // System-wide Account factory

    // Contracts
    HybridAccount public hybridAccount;
    HCHelper public hcHelper;
    PresiSimToken public presiSimToken;
//    TokenPaymaster public tokenPaymaster;

    function run() public {
        deployerAddress = vm.addr(deployerPrivateKey);
//        tokenPaymaster = TokenPaymaster(address(0x8223388f7aF211d84289783ed97ffC5Fefa14256));
//        console.log(address(tokenPaymaster.entryPoint()));

        vm.startBroadcast(deployerPrivateKey);

        hcHelper = new HCHelper(
            entrypoint,
            hcHelperAddr,
            0x4e59b44847b379578588920cA78FbF26c0B4956C
        );

        // Deploy using HybridAccountFactory, salt = block.number to force redeploy HybridAccount if already existing from this wallet
        hybridAccount = HybridAccountFactory(haFactory).createAccount(deployerAddress, block.number);
        console.log("Account created");
        console.log(address(hybridAccount));

//      fund the entrypoint to pay for operations for this hybridAccount
        IEntryPoint(entrypoint).depositTo{value: 0.01 ether}(address(hybridAccount));
        console.log("Account Deposited");
        //        IEntryPoint(entrypoint).depositTo{value: 0.01 ether}(address(tokenPaymaster)); // might be redundant
//      tokenPaymaster.deposit{value: 0.01 ether}();

        console.log("HA created");
        console.log(address(hybridAccount));
        // deploy your own contract
        presiSimToken = new PresiSimToken(address(hybridAccount));
        console.log("PresiSim Token");

        // register url, add credit
        // only owner - reach out to Boba foundation: hcHelper.RegisterUrl(address(hybridAccount), backendURL);
        console.log("Adding Credit...");
//        hcHelper.AddCredit(address(hybridAccount), 100);
        console.log("Credits added");
        hybridAccount.PermitCaller(address(presiSimToken), true);
        console.log("Caller permitted");
        // permit caller
//        hybridAccount.initialize(deployerAddress);
        vm.stopBroadcast();
    }
}