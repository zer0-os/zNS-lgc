import * as hre from "hardhat";
import { ethers } from "hardhat";

import {
  Registrar__factory,
  OriginalRegistrar__factory,
} from "../typechain";
import { getLogger } from "../utilities";
import { zer0ProtocolAddresses } from "@zero-tech/zero-contracts"

const logger = getLogger("scripts::test-filter");

// Goerli Addresses
const hubAddress = "0xce1fE2DA169C313Eb00a2bad25103D2B9617b5e1";

const main = async () => {
  const [deployer] = await hre.ethers.getSigners();
  const network = hre.network.name

  logger.log(`Using deployer address ${deployer.address}`);

  let registrarAddress;

  const addresses = zer0ProtocolAddresses[hre.network.name];
  if (!addresses) {
    throw Error(`Network ${hre.network.name} not supported.`)
  }

  registrarAddress = addresses.zNS.registrar;

  logger.log(`Upgrading Registrar at ${registrarAddress} to include OpenSea filter functionality`);

  // Factory for registrar that includes of the OS changes
  const upgradeRegistrarTx = await hre.upgrades.upgradeProxy(
    registrarAddress!,
    new Registrar__factory(deployer)
  );

  const upgradedRegistrar = await upgradeRegistrarTx.deployed();

  logger.log(`Successfully upgraded registrar at ${upgradedRegistrar.address}`);
}

main();
