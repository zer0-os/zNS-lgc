import { ethers } from "hardhat";
import * as hre from "hardhat"
import {
  MigrationRegistrar,
  MigrationRegistrar__factory,
  Registrar__factory,
  ZNSHub__factory,
} from "../../../typechain";
import { getAddressesForNetwork } from "./addresses";
import { BigNumber, ContractTransaction } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { getLogger } from "../../../utilities";

const getDomainId = async (tx: ContractTransaction) => {
  const receipt = await tx.wait()
  return BigNumber.from(receipt.events![0].args!["tokenId"]);
}

const logger = getLogger("scripts::runTestNetwork");

export const runMigration = async (signer: SignerWithAddress) => {
  const signerAddress = await signer.getAddress();
  const network = hre.network.name;
  const addresses = getAddressesForNetwork(network);

  logger.log(`Using network ${network} for migration`)

  const legacyRegistrarAddress = addresses.registrar;
  const beaconAddress = addresses.subregistrarBeacon;
  const wilderDomainId = addresses.wilderDomainId;
  const rootDomainId = "0";

  const zNSHub = ZNSHub__factory.connect(addresses.zNSHub, signer);

  logger.log("Begin Migration on Goerli");
  logger.log("2. Upgrade existing proxies to have needed functionality");
  logger.log("2.a. Upgrade legacy Registrar");
  const upgradeRegistrarTx: MigrationRegistrar = await hre.upgrades.upgradeProxy(
    legacyRegistrarAddress,
    new MigrationRegistrar__factory(signer)
  ) as MigrationRegistrar;
  const upgradedLegacyRegistrar = await upgradeRegistrarTx.deployed()

  logger.log("2.b. Upgrade Beacon registrars");
  const upgradeBeaconTx: MigrationRegistrar = await hre.upgrades.upgradeBeacon(
    beaconAddress,
    new MigrationRegistrar__factory(signer)
  ) as MigrationRegistrar;
  const upgradedBeacon = await upgradeBeaconTx.deployed();

  logger.log("3. Burn root and wilder domains on legacy registrar");
  await upgradedLegacyRegistrar.connect(signer).burnDomain(wilderDomainId);
  await upgradedLegacyRegistrar.connect(signer).burnDomain(rootDomainId);

  logger.log("Verify burn");
  const wilderDomainExists = await upgradedLegacyRegistrar.domainExists(wilderDomainId);
  const rootDomainExists = await upgradedLegacyRegistrar.domainExists(rootDomainId);

  if (wilderDomainExists || rootDomainExists) {
    throw Error("Burn didn't work");
  }

  logger.log("4. Deploy new root registrar as proxy to existing subdomain registrar beacon");
  const newRegistrarTx = await hre.upgrades.deployBeaconProxy(
    upgradedBeacon.address,
    new MigrationRegistrar__factory(signer),
    [
      ethers.constants.AddressZero, // parent registrar
      rootDomainId,
      "Zer0 Namespace Service",
      "ZNS",
      zNSHub.address
    ]
  ) as MigrationRegistrar;

  const beaconRegistrar = await newRegistrarTx.deployed();

  console.log(`New Beacon Registrar Address: ${beaconRegistrar.address}`);

  // Must do this to be able to mint below
  await zNSHub.addRegistrar(rootDomainId, beaconRegistrar.address);

  logger.log("5. Mint 0://wilder in new root registrar");
  const tx = await beaconRegistrar.connect(signer).mintDomain(
    ethers.constants.HashZero, // parent id
    "0://wilder",
    signerAddress,
    "ipfs.io/ipfs/Qm",
    0,
    false,
    signerAddress,
    beaconRegistrar.address
  );

  const newWilderDomainId = await getDomainId(tx);

  logger.log(`New Wilder domainId: ${newWilderDomainId.toHexString()}`);

  let tx_set;
  logger.log("6. Update the rootDomainId and parentRegistrar values on upgraded legacy");
  tx_set = await upgradedLegacyRegistrar.connect(signer).setRootDomainId(rootDomainId); // already 0?
  await tx_set.wait();
  tx_set = await upgradedLegacyRegistrar.connect(signer).setParentRegistrar(beaconRegistrar.address);
  await tx_set.wait();

  logger.log("7. Upgrade to legacy and beacon registrars to post-migration version (OG version)");
  logger.log("7a. Upgrade legacy registrar back to original Registrar");
  const postMigrationRegistrar = await hre.upgrades.upgradeProxy(
    upgradedLegacyRegistrar,
    new Registrar__factory(signer)
  );

  logger.log("7b. Upgrade beacon registrars to original Registrar");
  const postMigrationBeacon = await hre.upgrades.upgradeBeacon(
    upgradedBeacon.address,
    new Registrar__factory(signer)
  );

  return;
}
