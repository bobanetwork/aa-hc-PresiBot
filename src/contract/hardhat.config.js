require("@nomicfoundation/hardhat-toolbox");

require('dotenv').config();
require('hardhat-deploy');

require("@nomicfoundation/hardhat-verify");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  networks: {
    'boba-sepolia': {
      url: 'https://sepolia.boba.network',
      accounts: [process.env.PRIVATE_KEY_DEPLOYER || ethers.constants.HashZero],
    },
  },
  paths: {
    deploy: './deploy',
    deployment: './deployment',
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
  },
  solidity: "0.8.24",
  etherscan: {
    apiKey: {
      'boba-sepolia': 'NOT_NEEDED'
    },
    customChains: [
      {
        network: "boba-sepolia",
        chainId: 28882,
        urls: {
          apiURL: "https://api.routescan.io/v2/network/testnet/evm/28882/etherscan/api",
          browserURL: "https://testnet.bobascan.com/"
        }
      }
    ]
  }
};
