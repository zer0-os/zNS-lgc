import { ethers, upgrades, run } from "hardhat";
import * as hre from "hardhat"
import {
  MigrationRegistrar,
  MigrationRegistrar__factory,
  ZNSHub,
  Registrar,
  Registrar__factory,
} from "../../../typechain";
import { getAddressesForNetwork } from "./addresses";
import { BigNumber, Contract, ContractTransaction, Signer } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

const deployContractsHelper = async <T extends Contract>(contractName: string, args: any[]) => {
  const factory = await ethers.getContractFactory(contractName);
  const contract = await hre.upgrades.deployProxy(factory, args);
  return contract as T;
}

const getDomainId = async (tx: ContractTransaction) => {
  const receipt = await tx.wait()
  return BigNumber.from(receipt.events![0].args!["tokenId"]);
}

const deployContracts = async (): Promise<[ZNSHub, Registrar, Registrar]> => {
  const networkName = hre.network.name;
  const addresses = getAddressesForNetwork(networkName);

  // Deploy and init local contracts
  const zNSHub = await deployContractsHelper<ZNSHub>(
    "ZNSHub",
    [
      addresses.registrar,
      addresses.zNSHub
    ]
  );
  const legacyRegistrar = await deployContractsHelper<Registrar>(
    "Registrar",
    [
      ethers.constants.AddressZero,
      ethers.constants.Zero,
      "Zer0 Name Service",
      "ZNS",
      zNSHub.address
    ]
  );

  const factory = await ethers.getContractFactory("Registrar");
  const beacon = await hre.upgrades.deployBeacon(factory) as Registrar;

  return [zNSHub, legacyRegistrar, beacon];
}
const mintSamples = async (
  signer: SignerWithAddress,
  legacyRegistrar: Registrar
): Promise<[string, BigNumber]> => {
  const signerAddress = await signer.getAddress();
  const rootDomainId = "0";

  // Mint wilder
  const tx = await legacyRegistrar.connect(signer).registerDomain(
    rootDomainId,
    "0://wilder",
    signerAddress,
    "ipfs.io/ipfs/Qm",
    0,
    false
  );

  const wilderDomainId = await getDomainId(tx);

  return [rootDomainId, wilderDomainId];
}

export const runSimulation = async (signer: SignerWithAddress) => {
  const signerAddress = await signer.getAddress();

  // Preliminary requirements for simulated run
  const [zNSHub, legacyRegistrar, beacon] = await deployContracts();

  await zNSHub.addRegistrar(ethers.constants.HashZero, legacyRegistrar.address);
  await legacyRegistrar.connect(signer).addController(signerAddress);

  const [rootDomainId, wilderDomainId] = await mintSamples(signer, legacyRegistrar);

  // Begin Migration simulation
  // 2. Upgrade existing proxies to have needed functionality
  // 2.a. Upgrade legacy Registrar
  const upgradeRegistrarTx: MigrationRegistrar = await hre.upgrades.upgradeProxy(
    legacyRegistrar,
    new MigrationRegistrar__factory(signer)
  ) as MigrationRegistrar;
  const upgradedLegacyRegistrar = await upgradeRegistrarTx.deployed()

  // 2.b. Upgrade Beacon registrars
  const upgradeBeaconTx: MigrationRegistrar = await hre.upgrades.upgradeBeacon(
    beacon,
    new MigrationRegistrar__factory(signer)
  ) as MigrationRegistrar;
  const upgradedBeacon = await upgradeBeaconTx.deployed();

  // 3. Burn domains
  await upgradedLegacyRegistrar.connect(signer).burnDomain(wilderDomainId);
  await upgradedLegacyRegistrar.connect(signer).burnDomain(rootDomainId);

  // Verify burn
  const wilderDomainExists = await upgradedLegacyRegistrar.domainExists(wilderDomainId);
  const rootDomainExists = await upgradedLegacyRegistrar.domainExists(rootDomainId);

  if (wilderDomainExists || rootDomainExists) {
    throw Error("Burn didn't work");
  }

  // 4. Deploy new root registrar as proxy to existing subdomain registrar beacon
  const newRegistrarTx = await hre.upgrades.deployBeaconProxy(
    upgradedBeacon.address,
    new MigrationRegistrar__factory(signer),
    [
      ethers.constants.AddressZero, // parent registrar
      ethers.constants.HashZero, // root domain id
      "Zer0 Namespace Service",
      "ZNS",
      zNSHub.address
    ]
  ) as MigrationRegistrar;

  const beaconRegistrar = await newRegistrarTx.deployed();

  console.log(`beaconRegistrar: ${beaconRegistrar.address}`)

  await zNSHub.addRegistrar(rootDomainId, beaconRegistrar.address);

  // 5. Mint 0://wilder in new root registrar
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

  console.log("new wilder domain: ", newWilderDomainId.toHexString());

  let tx_set;
  // 6. Update the rootDomainId and parentRegistrar values on upgraded legacy
  tx_set = await upgradedLegacyRegistrar.connect(signer).setRootDomainId(ethers.constants.HashZero);
  await tx_set.wait();
  tx_set = await upgradedLegacyRegistrar.connect(signer).setParentRegistrar(beaconRegistrar.address);
  await tx_set.wait();

  console.log(`upgraded legacy registrar address: ${await upgradedLegacyRegistrar.address}`);
  console.log(`upgraded legacy registrar parent: ${await upgradedLegacyRegistrar.parentRegistrar()}`);

  // 7. Upgrade to legacy and beacon registrars to post-migration version (OG version)
  // 7a. Upgrade legacy registrar back to original Registrar
  const postMigrationRegistrar = await hre.upgrades.upgradeProxy(
    upgradedLegacyRegistrar,
    new Registrar__factory(signer)
  );

  // 7b. Upgrade beacon registrars to original Registrar
  const postMigrationBeacon = await hre.upgrades.upgradeBeacon(
    upgradedBeacon.address,
    new Registrar__factory(signer)
  );

  return;
}
