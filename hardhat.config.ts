require("dotenv").config();
import { task, HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
import "hardhat-typechain";
import "@openzeppelin/hardhat-upgrades";

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (args, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(await account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more
const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.7.6",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          },
        },
      },
      {
        version: "0.6.12",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          },
        },
      },
    ],
  },
  networks: {
    hardhat: {
      forking: {
        url:
          "https://eth-mainnet.alchemyapi.io/v2/MnO3SuHlzuCydPWE1XhsYZM_pHZP8_ix",
        blockNumber: 11845661,
      },
    },
    ropsten: {
      accounts: { mnemonic: process.env.MNEMONIC },
      url: "https://ropsten.infura.io/v3/77c3d733140f4c12a77699e24cb30c27",
    },
    rinkeby: {
      accounts: { mnemonic: process.env.MNEMONIC },
      url: "https://rinkeby.infura.io/v3/77c3d733140f4c12a77699e24cb30c27",
    },
  },
  mocha: {
    timeout: 60 * 1000,
  },
};

export default config;
