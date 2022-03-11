"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// eslint-disable-next-line @typescript-eslint/no-var-requires
require("dotenv").config();
const config_1 = require("hardhat/config");
require("@nomiclabs/hardhat-waffle");
require("@typechain/hardhat");
require("@nomiclabs/hardhat-ethers");
require("@openzeppelin/hardhat-upgrades");
require("@nomiclabs/hardhat-etherscan");
require("solidity-coverage");
config_1.task("accounts", "Prints the list of accounts", async (args, hre) => {
    const accounts = await hre.ethers.getSigners();
    for (const account of accounts) {
        console.log(account.address);
    }
});
const config = {
    solidity: {
        compilers: [
            {
                version: "0.7.3",
                settings: {
                    outputSelection: {
                        "*": {
                            "*": ["storageLayout"],
                        },
                    },
                    optimizer: {
                        enabled: true,
                    },
                },
            },
        ],
    },
    paths: {
        sources: "./contracts",
        tests: "./test",
    },
    mocha: {
        timeout: 50000,
    },
    networks: {
        hardhat: {
            accounts: { mnemonic: process.env.MAINNET_MNEMONIC || "" },
            forking: {
                url: "https://eth-mainnet.alchemyapi.io/v2/MnO3SuHlzuCydPWE1XhsYZM_pHZP8_ix",
            },
        },
        mainnet: {
            accounts: [`${process.env.MAINNET_PRIVATE_KEY}`],
            url: `https://mainnet.infura.io/v3/0e6434f252a949719227b5d68caa2657`,
            gasPrice: 130000000000,
        },
        kovan: {
            accounts: [`${process.env.TESTNET_PRIVATE_KEY}`],
            url: `https://kovan.infura.io/v3/0e6434f252a949719227b5d68caa2657`,
        },
        ropsten: {
            accounts: [`${process.env.TESTNET_PRIVATE_KEY}`],
            url: "https://ropsten.infura.io/v3/77c3d733140f4c12a77699e24cb30c27",
        },
        rinkeby: {
            accounts: [`${process.env.TESTNET_PRIVATE_KEY}`],
            url: "https://rinkeby.infura.io/v3/fa959ead3761429bafa6995a4b25397e",
        },
        localhost: {
            gas: "auto",
            gasPrice: "auto",
            gasMultiplier: 1,
            url: "http://127.0.0.1:8545",
            chainId: 1776,
            accounts: {
                mnemonic: "test test test test test test test test test test test test",
            },
        },
    },
    etherscan: {
        apiKey: "FZ1ANB251FC8ISFDXFGFCUDCANSJNWPF9Q",
    },
};
exports.default = config;
