// require('@nomiclabs/hardhat-toolbox');
require('dotenv').config();

const { PRIVATE_KEY, ETHERSCAN_API_KEY } = process.env;

module.exports = {
  solidity: '0.8.20',
  networks: {
    boba_sepolia: {
      url: 'https://sepolia.boba.network',
      accounts: [PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
};
