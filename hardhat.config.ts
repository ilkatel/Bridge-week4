import * as dotenv from "dotenv";

import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-web3";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "hardhat-change-network";
import "solidity-coverage";
import "./tasks";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.4",
  networks: {
    rinkeby: {
      url: `https://eth-rinkeby.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: [`${process.env.PRIVATE_KEY}`],
      gas: 2100000,
      gasPrice: 20000000000,
    },
    bsc: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
      chainId: 97,
      gasPrice: 20000000000,
      accounts: [`${process.env.PRIVATE_KEY}`]
    },
    hardhat: { },
  },
  etherscan: {
    apiKey: {
      rinkeby: process.env.ETHERSCAN_API_KEY,
      bscTestnet: process.env.BSC_API_KEY
    }
  },
  defaultNetwork: "rinkeby",
};

export default config;
