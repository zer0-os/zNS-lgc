import { ethers } from "hardhat";
import * as hre from "hardhat"
import {
  ZNSHub,
  Registrar,
  MigrationRegistrar,
} from "../../../typechain";
import { getAddressesForNetwork } from "./addresses";
import { BigNumber, Contract, ContractTransaction, Signer } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

export const deployContractsHelper = async <T extends Contract>(contractName: string, args: any[]) => {
  const factory = await ethers.getContractFactory(contractName);
  const contract = await hre.upgrades.deployProxy(factory, args);
  return contract as T;
}

export const getDomainId = async (tx: ContractTransaction, waitBlocks: number) => {
  const receipt = await tx.wait(waitBlocks)
  return BigNumber.from(receipt.events![0].args!["tokenId"]);
}

export const deployContracts = async (): Promise<[ZNSHub, Registrar, Registrar]> => {
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
      ethers.constants.AddressZero, // parent registrar
      ethers.constants.Zero, // root domain id
      "Zer0 Name Service",
      "ZNS",
      zNSHub.address
    ]
  );

  const factory = await ethers.getContractFactory("Registrar");
  const beacon = await hre.upgrades.deployBeacon(factory) as Registrar;

  return [zNSHub, legacyRegistrar, beacon];
}

export const mintSampleWilderDomain = async (
  signer: SignerWithAddress,
  legacyRegistrar: Registrar
): Promise<BigNumber> => {
  const signerAddress = await signer.getAddress();
  const rootDomainId = "0";

  // Mint wilder
  const tx = await legacyRegistrar.connect(signer).registerDomain(
    rootDomainId,
    "wilder",
    signerAddress,
    "ipfs://QmSQTLzzsPS67ay4SFKMv9Dq57iSQ7pLWQVUvS3XB5MowK/0",
    0,
    false
  );

  const wilderDomainId = await getDomainId(tx, 0);

  return wilderDomainId;
}

export const updateRegistrarValues = async (
  signer: SignerWithAddress,
  registrar: MigrationRegistrar,
  rootDomainId: string,
  beaconRegistrarAddress: string,
  waitBlocks: number
) => {
  let tx: ContractTransaction;
  tx = await registrar.connect(signer).setRootDomainId(rootDomainId);
  await tx.wait(waitBlocks);
  tx = await registrar.connect(signer).setParentRegistrar(beaconRegistrarAddress);
  await tx.wait(waitBlocks);
}
