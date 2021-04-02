# Zer0 Name Service Contracts

This repository contains the smart contracts for the Zer0 Naming Service (ZNS) from the Zer0 Network.

## Architecture and Documentation

Check out the [docs](./docs/) folder for more documentation such as architecture.

## Building and Development

Follow this guide to learn how to get started with building and developing locally.

This guide will assume you are using [Visual Studio Code](https://code.visualstudio.com/) as an IDE, however you can use whatever IDE you would like.

### Required Tools

This project requires [yarn](https://yarnpkg.com/) to be installed on your system, as well as [node.js](https://nodejs.org/en/download/).
Please ensure those are installed on your system before continuing.

### Getting Started

In the command line terminal, run the following:

```bash
yarn
```

This will:

- Install required node packages (*this may take awhile*)
- Compile the smart contracts
- Generate [typechain](https://github.com/ethereum-ts/TypeChain) helper types

This step should complete without any errors.
If you encounter errors there may be something wrong with your `node` or `yarn` installation, ensure you have node version 14 or higher.

If you are still encountering errors please file a GitHub issue with as much detail as possible.

### Running Tests

To run the tests for the smart contracts simply run

```bash
yarn test
```

You can check test coverage by running

```bash
yarn coverage
```

> You may get a warning about contract code size exceeding 24576 bytes, you can ignore this.

### Compiling Contracts

If you ever need to recompile the smart contracts you can run

```bash
yarn compile
```

To recompile the smart contracts.

> Running `yarn compile` will also re-generate the typechain helpers

> In some cases you may need to clean previously built artifacts, if you run into errors you can try running `yarn build` which will clean and re-compile the smart contracts

### Linting

You can lint any Solidity and TypeScript files in the project by running:

```bash
yarn lint
```

Many linting issues can be solved automatically by running:

```bash
yarn fix
```

> Ensure you run both `yarn fix` and `yarn lint` before creating a pull request.

> You may get some line-ending errors, this project expects that line-endings are LF and not CRLF.

## Deploying

Deployment is done in multiple steps which are to be performed in order.
### Requirements

Before you can deploy you must choose the wallet to deploy from.
This can be done using a mnemonic phrase that is set in a `.env` file.

Create a `.env` file with the contents:

```env
TESTNET_MNEMONIC=<insert your mnemonic here for testnet deployments>
MAINNET_MNEMONIC=<insert your mnemonic here for mainnet deployments>
```

If you are deploying to kovan, ropsten, or rinkeby, set the `TESTNET_MNEMONIC` variable.

If you are deploying to mainnet set the `MAINNET_MNEMONIC` variable.

**Do not under any circumstance commit your `.env` file to source control**

> Some additional recommendations:  
> - **Delete** your `.env` file after you finish deploying contracts
> - Never use the same mnemonic for testnets and mainnet
> - Never use your personal wallet or mnemonic
> - Always use a different mnemonic for each new mainnet deployment


### Deploy Registrar

The Registrar can must be deployed by running the command:

```bash
yarn hardhat run .\scripts\deploy-registrar.ts --network <network>
```

> Replace `<network>` with `mainnet`, `kovan`, `ropsten`, or `rinkeby`.

This will deploy the `Registrar` contract using an OpenZeppelin upgradeability proxy.

You may notice a `deployments` folder being created, if you inspect the `./deployments/<network>.json` file you will find the address of the deployed Registrar under (`registrar.address`)

> It is recommended you commit and push any changes to `./deployments/<network>.json` file for historical tracking of deployed instances

### Deploy Basic Controller

The Basic Controller can must be deployed by running the command:

> The Registrar must already be deployed to run this command.

```bash
yarn hardhat run .\scripts\deploy-basic-controller.ts --network <network>
```

This will deploy the `BasicController` contract using an OpenZeppelin upgradeability proxy.

The `./deployments/<network>.json` file will be updated and you will find the address of the deployed Basic Controller under (`basicController.address`)

### Add the controller to the Registrar

To add the controller to the registrar, thus making it functional, you must run the command:

> The Registrar and Basic Controller must already be deployed to run this command.

```bash
yarn hardhat run .\scripts\add-controller.ts --network <network>
```

Once this command has finished running the controller will be able to register new domains with the registrar.

## Scripts to help with testing

Testing on Kovan before a mainnet deployment is highly recommended.

Kovan ether can be gained either through the [Kovan Faucet](https://github.com/kovan-testnet/faucet) or by requesting some from the [Kovan Forums](https://forum.poa.network/c/kovan-testnet/62).

### Send Kovan Eth to accounts

You can send Kovan ether from a wallets account[0] to account[n] (where n is 1-6) by running the command:

> You will need ~10 Kovan Eth in account[0] to run this.  
> If you don't have that much, you can change the script manually

```bash
yarn hardhat run .\scripts\send-eth.ts --network <network>
```

> This is merely a helper script, you don't need to run this and it can always be done manually

### Simulate usage

You can simulate usage of a Kovan deployed Registrar by running:

```bash
yarn hardhat run .\scripts\simulate.ts --network <network>
```

This will:
- Create domains
- Create subdomains
- Transfer domains and subdomains to different users
- Set metadata on a domain
- Lock metadata on a domain
- Unlock metadata on a domain
- Set royalty amount on a domain

It will use the first 7 accounts on a mnemonic wallet.
