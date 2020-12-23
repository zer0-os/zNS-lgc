require('dotenv').config()
import { task, HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
import "hardhat-typechain";

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
  solidity: "0.7.6",
  networks: {
    ropsten: {
      accounts: { mnemonic: process.env.MNEMONIC },
      url: 'https://ropsten.infura.io/v3/77c3d733140f4c12a77699e24cb30c27'
    },
    rinkeby: {
      accounts: { mnemonic: process.env.MNEMONIC },
      url: 'https://rinkeby.infura.io/v3/77c3d733140f4c12a77699e24cb30c27'
    },
  },
};

export default config
