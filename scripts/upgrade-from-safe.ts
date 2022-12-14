import * as hre from "hardhat";

import { Registrar__factory } from "../typechain";
import { getLogger } from "../utilities";
import { zer0ProtocolAddresses } from "@zero-tech/zero-contracts";
import {
  getProxyAdminFactory,
  getUpgradeableBeaconFactory,
} from "@openzeppelin/hardhat-upgrades/dist/utils";
import { getAdminAddress } from "@openzeppelin/upgrades-core";
import { EthereumNetwork } from "./shared/config";
import { proposeTransaction, verifyContract } from "./shared/helpers";

const logger = getLogger("scripts::upgrade-from-safe");

const GnosisSafeAddress: { [key in EthereumNetwork]: string } = {
  goerli: "0x44B735109ECF3F1A5FE56F50b9874cEf5Ae52fEa",
  mainnet: "", // todo
};

const main = async () => {
  const [deployer] = await hre.ethers.getSigners();

  logger.log(`Using deployer address ${deployer.address}`);

  let registrarAddress: string;
  let beaconAddress: string;
  if (hre.network.name === "goerli" || hre.network.name === "mainnet") {
    const addresses = zer0ProtocolAddresses[hre.network.name];
    if (!addresses) {
      throw Error(`Network ${hre.network.name} not supported.`);
    }
    registrarAddress = addresses.zNS.registrar!;
    beaconAddress = addresses.zNS.subregistrarBeacon!;
    logger.log(`Registrar Proxy is at ${registrarAddress}`);
    logger.log(`UpgradeableBeacon is at ${registrarAddress}`);

    logger.log("Deploying new implementation ...");
    const RegistrarFactory = new Registrar__factory(deployer);
    const newRegistrar = await RegistrarFactory.deploy();
    await newRegistrar.deployTransaction.wait(2);

    logger.log(
      `New Registrar(implementation) deployed at ${newRegistrar.address}`
    );
    await verifyContract(newRegistrar.address);

    // Get ProxyAdmin address
    const proxyAdminAddress = await getAdminAddress(
      hre.ethers.provider,
      registrarAddress
    );
    logger.log(`ProxyAdmin is at ${proxyAdminAddress}`);

    // Get ProxyAdmin contract
    const ProxyAdminFactory = await getProxyAdminFactory(hre, deployer);
    const proxyAdmin = ProxyAdminFactory.attach(proxyAdminAddress);

    logger.log("Proposing transaction for TransparentProxy to Gnosis Safe");
    await proposeTransaction(
      hre.network.name,
      GnosisSafeAddress[hre.network.name],
      proxyAdmin,
      "upgrade",
      [registrarAddress, newRegistrar.address],
      ProxyAdminFactory.interface,
      deployer
    );

    const UpgradeableBeaconFactory = await getUpgradeableBeaconFactory(
      hre,
      deployer
    );
    const upgradeableBeacon = UpgradeableBeaconFactory.attach(beaconAddress);
      
    logger.log("Proposing transaction for BeaconProxy to Gnosis Safe");
    await proposeTransaction(
      hre.network.name,
      GnosisSafeAddress[hre.network.name],
      upgradeableBeacon,
      "upgradeTo",
      [newRegistrar.address],
      UpgradeableBeaconFactory.interface,
      deployer
    );

    logger.log("Congratulations! You can check your Gnosis Safe!");
  }
};

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

