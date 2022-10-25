import { ethers, upgrades, run } from "hardhat";
import * as hre from "hardhat"
import {
  MigrationRegistrar,
  MigrationRegistrar__factory,
  ZNSHub,
  Registrar,
} from "../../../typechain";
import { getAddressesForNetwork } from "./addresses";
import { BigNumber, Contract, ContractTransaction, Signer } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { domain } from "process";

// For hardhat only
const deployContractsHelper = async <T extends Contract>(contractName: string, args: any[]) => {
  const factory = await ethers.getContractFactory(contractName);
  const contract = await hre.upgrades.deployProxy(factory, args);
  return contract as T;
}

const deployContracts = async (): Promise<[ZNSHub, Registrar, Registrar]> => {
  const networkName = hre.network.name;
  const addresses = getAddressesForNetwork(networkName);

  // Deploy and init local contracts
  const zNSHub = await deployContractsHelper<ZNSHub>(
    "ZNSHub",
    [
      addresses.legacyRegistrar,
      addresses.hubBeaconProxy
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
): Promise<[BigNumber, BigNumber]> => {
  const signerAddress = await signer.getAddress();

  // Mint necessary sample domains
  const tx_1 = await legacyRegistrar.connect(signer).registerDomain(
    hre.ethers.constants.AddressZero,
    "0://",
    signerAddress,
    "ipfs.io/ipfs/Qm",
    0,
    false
  );

  // Real root domain is just 0 address, use this for testing
  const receipt_1 = await tx_1.wait();
  const rootDomainId = BigNumber.from(receipt_1.events![0].args!["tokenId"]);

  const tx_2 = await legacyRegistrar.connect(signer).registerDomain(
    rootDomainId,
    "0://wilder",
    signerAddress,
    "ipfs.io/ipfs/Qm",
    0,
    false
  );

  const receipt_2 = await tx_2.wait();
  const wilderDomainId = BigNumber.from(receipt_2.events![0].args!["tokenId"]);

  return [rootDomainId, wilderDomainId];
}

export const runSimulation = async (signer: SignerWithAddress) => {
  const signerAddress = await signer.getAddress();

  // Preliminary requirements for simulated run
  const [zNSHub, legacyRegistrar, beacon] = await deployContracts();

  await zNSHub.addRegistrar(ethers.constants.HashZero, legacyRegistrar.address);
  await legacyRegistrar.connect(signer).addController(signerAddress);

  const [rootDomainId, wilderDomainId] = await mintSamples(signer, legacyRegistrar);

  console.log(rootDomainId)
  console.log(wilderDomainId)
  // Begin Migration simulation
  // 2. Upgrade existing proxies to have needed functionality
  // 2.a. Upgrade legacy Registrar
  const upgradedRegistrar: MigrationRegistrar = await hre.upgrades.upgradeProxy(
    legacyRegistrar,
    new MigrationRegistrar__factory(signer)
  ) as MigrationRegistrar;

  // 2.b. Upgrade Beacon registrars
  const upgradedBeacon: MigrationRegistrar = await hre.upgrades.upgradeBeacon(
    beacon,
    new MigrationRegistrar__factory(signer)
  ) as MigrationRegistrar;

  // 3. Burn domains
  await upgradedRegistrar.connect(signer).burnDomain(wilderDomainId);
  await upgradedRegistrar.connect(signer).burnDomain(rootDomainId);

  // Verify burn
  const wilderDomainExists = await upgradedRegistrar.domainExists(wilderDomainId);
  const rootDomainExists = await upgradedRegistrar.domainExists(rootDomainId);

  if (wilderDomainExists || rootDomainExists) {
    throw Error("Burn didn't work");
  }

  // 4. Deploy new root registrar, new beacon or existing subdomain registrar beacon?

  // Q. Use a new beacon for the root registrar? or same beacon as subregistrars?
  // const newRegistrarBeacon = await hre.upgrades.deployBeacon(
  //   new MigrationRegistrar__factory(signer)
  // );
  const newRegistrar = await hre.upgrades.deployBeaconProxy(
    beacon.address,
    new MigrationRegistrar__factory(signer),
    [
      ethers.constants.AddressZero,
      ethers.constants.AddressZero,
      "Zer0 Namespace Service",
      "ZNS",
      zNSHub.address
    ]
  );

  const newRootRegistrar = await newRegistrar.deployed();
  await zNSHub.addRegistrar(ethers.constants.HashZero, newRootRegistrar.address)
  await zNSHub.setDefaultRegistrar(newRootRegistrar.address)

  let domainId: string;

  zNSHub.on("EEDomainCreatedV3", async (_, id) => {
    domainId = id;
  });

  // 5. Mint 0://wilder on new root registrar
  const tx = await newRootRegistrar.connect(signer).mintDomain(
    ethers.constants.AddressZero,
    "0://wilder",
    signerAddress,
    "ipfs.io/ipfs/Qm",
    0,
    false,
    signerAddress,
    newRootRegistrar.address
  );

  console.log("domainId: ", domainId!);

  // const receipt = await tx.wait();

  // console.log(listeners);

  // const recordsList = await newRootRegistrar.records.length;
  // console.log(receipt);

  return;
}
