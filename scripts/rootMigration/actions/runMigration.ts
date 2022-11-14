import * as hre from "hardhat";
import { BigNumber } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import * as safe from '@gnosis.pm/safe-core-sdk';


import { ethers } from 'ethers';
import EthersAdapter, { EthersAdapterConfig } from '@gnosis.pm/safe-ethers-lib'
import Safe, { SafeConfig, SafeAccountConfig, SafeFactoryConfig, SafeFactory, SafeDeploymentConfig } from '@gnosis.pm/safe-core-sdk'

import {
  MigrationRegistrar,
  MigrationRegistrar__factory,
  Registrar__factory,
  ZNSHub__factory,
} from "../../../typechain";
import { getAddressesForNetwork } from "./addresses";
import { getLogger } from "../../../utilities";

import * as helpers from "./helpers";
import { ContractNetworkConfig, ContractNetworksConfig } from "@gnosis.pm/safe-core-sdk/dist/src/types";
import { TransactionOptions } from "@gnosis.pm/safe-core-sdk-types";
import SafeServiceClient from '@gnosis.pm/safe-service-client'

const logger = getLogger("scripts::runMigration");

export const runMigration = async (
  signer: SignerWithAddress,
  network: string
) => {
  const signerAddress = await signer.getAddress();
  const addresses = getAddressesForNetwork(network);

  logger.log(`Using network ${network} for migration`);

  // Print all accounts
  // await hre.run("accounts");

  const rootDomainId = "0";
  const waitBlocks = network === "hardhat" ? 0 : 3;

  const legacyRegistrarAddress = addresses.registrar;
  const legacyRegistrarOwner = addresses.registrarOwner;
  const zNSHubAddress = addresses.zNSHub;
  const beaconAddress = addresses.subregistrarBeacon;
  const wilderDomainId = addresses.wilderDomainId;

  const ethAdapter: EthersAdapter = new EthersAdapter({
    ethers,
    signer
  });

  // Gnosis Safe SDK for Hardhat
  const networkConfig: ContractNetworksConfig = {
    // Mainnet
    "1": helpers.getGnosisNetworkConfig(network),
    // Goerli
    "5": helpers.getGnosisNetworkConfig(network),
    // Hardhat
    "31337": helpers.getGnosisNetworkConfig(network)
  };

  let safeSdk: Safe;
  if (network === "hardhat") {
    // Deploy a fake Gnosis safe for testing
    console.log(1)
    const factoryConfig: SafeFactoryConfig = {
      ethAdapter,
      contractNetworks: networkConfig
    }
    const safeFactory = await SafeFactory.create(factoryConfig);
    console.log(2)

    const safeAccountConfig: SafeAccountConfig = {
      owners: [signerAddress],
      threshold: 1,
    }
    const safeDeploymentConfig: SafeDeploymentConfig = {
      saltNonce: "1"
    }
    const options: TransactionOptions = {
      gasLimit: 10000000
    }
    console.log(3)
    // cannot estimate gas
    safeSdk = await safeFactory.deploySafe({
      safeAccountConfig,
      safeDeploymentConfig,
      options
    });
  } else {
    const safeConfig: SafeConfig = {
      ethAdapter,
      safeAddress: addresses.registrarOwner
    };
    safeSdk = await Safe.create(safeConfig);
  }

  // Passing '--network mainnet' to CLI
  console.log(await safeSdk.getAddress());
  console.log(await safeSdk.getContractManager());
  console.log(await safeSdk.getChainId());
  console.log(await safeSdk.getMultiSendAddress());
  console.log(await safeSdk.getMultiSendCallOnlyAddress());

  return;

  // The address for the legacy registrar is not in the manifest we must force
  // hardhat to use it and allow us to upgrade it.
  if (network !== "goerli") {
    await hre.upgrades.forceImport(legacyRegistrarAddress, new Registrar__factory());
  }

  const zNSHub = ZNSHub__factory.connect(zNSHubAddress, signer);

  logger.log("2. Upgrade existing proxies to have needed functionality");

  logger.log("2.a. Upgrade legacy Registrar");
  const upgradeRegistrarTx = await hre.upgrades.upgradeProxy(
    legacyRegistrarAddress,
    new MigrationRegistrar__factory(signer)
  );
  const upgradedLegacyRegistrar = await upgradeRegistrarTx.deployed() as MigrationRegistrar;

  logger.log("2.b. Upgrade Beacon registrars");
  const upgradeBeaconTx = await hre.upgrades.upgradeBeacon(
    beaconAddress,
    new MigrationRegistrar__factory(signer)
  );
  const upgradedBeacon = await upgradeBeaconTx.deployed() as MigrationRegistrar;

  logger.log("3. Burn root and wilder domains on legacy registrar");
  const burnWilderTx = await upgradedLegacyRegistrar.connect(signer).burnDomain(wilderDomainId);
  await burnWilderTx.wait(waitBlocks);

  const burnRootTx = await upgradedLegacyRegistrar.connect(signer).burnDomain(rootDomainId);
  await burnRootTx.wait(waitBlocks);

  logger.log("Verify burn");
  const wilderDomainExists = await upgradedLegacyRegistrar.domainExists(wilderDomainId);
  const rootDomainExists = await upgradedLegacyRegistrar.domainExists(rootDomainId);

  if (wilderDomainExists || rootDomainExists) {
    throw Error("Burn didn't work");
  }

  logger.log("4. Deploy new root registrar as proxy to existing subdomain registrar beacon");
  const newRegistrarTx = await hre.upgrades.deployBeaconProxy(
    upgradedBeacon.address,
    new MigrationRegistrar__factory(signer), // deploy as version 0 registrar?
    [
      hre.ethers.constants.AddressZero, // Parent registrar
      rootDomainId,
      "Zer0 Namespace Service",
      "ZNS",
      zNSHub.address
    ]
  );

  const newBeaconRegistrar = await newRegistrarTx.deployed() as MigrationRegistrar;

  logger.log(`New Beacon Registrar Address: ${newBeaconRegistrar.address}`);

  // Must do register the new registrar as authorized to be able to mint below
  const addRegistrarTx = await zNSHub.addRegistrar(rootDomainId, newBeaconRegistrar.address);
  await addRegistrarTx.wait(waitBlocks);

  logger.log("5. Mint wilder in new root registrar");
  const tx = await newBeaconRegistrar.connect(signer).mintDomain(
    hre.ethers.constants.HashZero, // parent id
    "wilder",
    signerAddress,
    "ipfs://QmSQTLzzsPS67ay4SFKMv9Dq57iSQ7pLWQVUvS3XB5MowK/0",
    0,
    false,
    newBeaconRegistrar.address
  );
  const receipt = await tx.wait(waitBlocks)
  const newWilderDomainId = BigNumber.from(receipt.events![0].args!["tokenId"]);

  if (wilderDomainId !== newWilderDomainId.toHexString()) {
    logger.error(
      `Original wilderDomainId: ${wilderDomainId} and minted newWilderDomainId ${newWilderDomainId.toHexString()} do not match.`
    );
  }

  logger.log(`New Wilder domainId: ${newWilderDomainId.toHexString()}`);

  logger.log("6. Update the rootDomainId and parentRegistrar values on upgraded legacy registrar");
  await helpers.updateRegistrarValues(
    signer,
    upgradedLegacyRegistrar,
    rootDomainId,
    newBeaconRegistrar.address,
    waitBlocks
  );

  logger.log("7. Upgrade to legacy and beacon registrars to post-migration version (OG version)");
  logger.log("7a. Upgrade legacy registrar back to original Registrar");
  const originalRegistrarTx = await hre.upgrades.upgradeProxy(
    upgradedLegacyRegistrar,
    new Registrar__factory(signer)
  );
  await originalRegistrarTx.deployed()

  logger.log("7b. Upgrade beacon registrars to original Registrar");
  const originalBeaconRegistrarTx = await hre.upgrades.upgradeBeacon(
    upgradedBeacon.address,
    new Registrar__factory(signer)
  );
  await originalBeaconRegistrarTx.deployed();

  return;
}
