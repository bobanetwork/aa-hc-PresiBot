import * as dotenv from "dotenv";
import {HardhatUserConfig} from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import "@nomicfoundation/hardhat-ignition-ethers";

dotenv.config();

const {PRIVATE_KEY} = process.env;
const DUMMY_PRIVATE_KEY = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'

let privateKeyToUse: string = PRIVATE_KEY!
if (!PRIVATE_KEY || PRIVATE_KEY.length !== DUMMY_PRIVATE_KEY.length) {
    console.warn("[hardhat.config] No or invalid PRIVATE_KEY defined!")
    privateKeyToUse = DUMMY_PRIVATE_KEY
}

const config: HardhatUserConfig & {
    etherscan: { apiKey: any; customChains: any };
} = {
    solidity: {
        version: "0.8.25",
        settings: {
            optimizer: {enabled: true, runs: 200},
        },
    },
    ignition: {
        requiredConfirmations: 1,
    },
    sourcify: {
        enabled: false,
    },
    networks: {
        boba_sepolia: {
            url: "https://sepolia.boba.network",
            accounts: [privateKeyToUse],
        },
        boba_local: {
            url: "http://localhost:9545",
            accounts: [privateKeyToUse],
        },
    },
    etherscan: {
        apiKey: {
            boba_sepolia: "boba",
        },
        customChains: [
            {
                network: "boba_sepolia",
                chainId: 28882,
                urls: {
                    apiURL:
                        "https://api.routescan.io/v2/network/testnet/evm/28882/etherscan",
                    browserURL: "https://testnet.bobascan.com",
                },
            },
        ],
    },
};

export default config;
