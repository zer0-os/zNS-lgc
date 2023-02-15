import * as helpers from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";
import * as fs from 'fs';
import {
  OperatorFilterRegistry__factory,
  Registrar,
  Registrar__factory,
  UpgradeableBeacon__factory,
  ZNSHub,
  ZNSHub__factory,
} from "../../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

const isOperatorFilterRegistryDeployed = async (): Promise<boolean> => {
  // Check if contract was deployed
  const code = await ethers.provider.getCode(
    "0x3cc6CddA760b79bAfa08dF41ECFA224f810dCeB6"
  );
  return code !== "0x";
};

/**
 * Deploy OperatorFilterRegistry at the address of "0x000000000000AAeB6D7670E522A718067333cd4E"
 * https://github.com/ProjectOpenSea/operator-filter-registry
 */
const deployOperatorFilterRegistry = async (deployer: SignerWithAddress): Promise<void> => {
  const deployed = await isOperatorFilterRegistryDeployed();
  if (deployed) {
    return;
  }

  // Get deployed bytecode from artifacts
  const OPERATOR_FILTER_REGISTRY_ADDRESS = "0x000000000000AAeB6D7670E522A718067333cd4E";
  const operatorFilterRegistryJson = fs.readFileSync(`./artifacts/operator-filter-registry/src/OperatorFilterRegistry.sol/OperatorFilterRegistry.json`);
  // Set bytecode at 0x000000000000AAeB6D7670E522A718067333cd4E
  await helpers.setCode(OPERATOR_FILTER_REGISTRY_ADDRESS, JSON.parse(operatorFilterRegistryJson.toString()).deployedBytecode);

  // Get deployed bytecode from artifacts
  const OWNED_REGISTRANT_ADDRESS = "0x3cc6CddA760b79bAfa08dF41ECFA224f810dCeB6"
  const ownedRegistrantJson = fs.readFileSync(`./artifacts/contracts/mocks/MockOwnedRegistrant.sol/MockOwnedRegistrant.json`);  
  // Set bytecode at 0x3cc6CddA760b79bAfa08dF41ECFA224f810dCeB6
  await helpers.setCode(OWNED_REGISTRANT_ADDRESS, JSON.parse(ownedRegistrantJson.toString()).deployedBytecode);

  // Since `hardhat_setCode` does not set or copy storage, it requires to 
  // set storage at 0x0 to set owner of `OwnedRegistrant` contract.
  // Do the same thing of `OwnedRegistrant` constructor

  // Set `deployer` account as owner of `OwnedRegistrant` contract
  const ownerSlot = "0x0"
  const value = ethers.utils.hexlify(ethers.utils.zeroPad(deployer.address, 32))
  await ethers.provider.send("hardhat_setStorageAt", [OWNED_REGISTRANT_ADDRESS, ownerSlot, value])

  const operatorFilterRegistryNew = OperatorFilterRegistry__factory.connect(
    OPERATOR_FILTER_REGISTRY_ADDRESS,
    deployer
    );
    
  // Register `OwnedRegistrant` contract to the `OperatorFilterRegistry`
  await operatorFilterRegistryNew.register(OWNED_REGISTRANT_ADDRESS);
  // Update operators in OperatorFilterRegistry
  await operatorFilterRegistryNew.updateOperators(
    OWNED_REGISTRANT_ADDRESS,
    [
      "0x00000000000111AbE46ff893f3B2fdF1F759a8A8",
      "0x59728544B08AB483533076417FbBB2fD0B17CE3a",
      "0xF849de01B080aDC3A814FaBE1E2087475cF2E354",
      "0x2B2e8cDA09bBA9660dCA5cB6233787738Ad68329",
    ],
    true
  );
};

export const deployZNS = async (
  deployer: SignerWithAddress
): Promise<{
  registrar: Registrar;
  zNSHub: ZNSHub;
}> => {
  await deployOperatorFilterRegistry(deployer);

  const ZNSHubFactory = new ZNSHub__factory(deployer);
  const zNSHub = (await ZNSHubFactory.deploy()) as ZNSHub;
  const RegistrarFactory = new Registrar__factory(deployer);
  const registrar = (await RegistrarFactory.deploy()) as Registrar;
  const UpgradeableBeaconFactory = new UpgradeableBeacon__factory(deployer);
  const upgradeableBeacon = await UpgradeableBeaconFactory.deploy(
    registrar.address
  );

  await zNSHub.initialize(registrar.address, upgradeableBeacon.address);
  await registrar.initialize(
    ethers.constants.AddressZero,
    ethers.constants.HashZero,
    "Zer0 Name Service",
    "ZNS",
    zNSHub.address
  );
  await zNSHub.addRegistrar(ethers.constants.HashZero, registrar.address);

  return {
    registrar,
    zNSHub,
  };
};
