import * as hre from "hardhat";
import { BigNumber, ethers, Signer } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  getProxyAdminFactory,
  getUpgradeableBeaconFactory,
} from "@openzeppelin/hardhat-upgrades/dist/utils";
import { getAdminAddress } from "@openzeppelin/upgrades-core";
import EthersAdapter from '@safe-global/safe-ethers-lib'
import Safe from '@safe-global/safe-core-sdk'
import { SafeTransactionDataPartial } from '@safe-global/safe-core-sdk-types'
import SafeServiceClient, { ProposeTransactionProps } from '@safe-global/safe-service-client'

import { exit } from "process";


import {
  MigrationRegistrar,
  MigrationRegistrar__factory,
  Registrar__factory,
  ZNSHub__factory,
} from "../../../typechain";
import { getAddressesForNetwork } from "./addresses";
import { getLogger } from "../../../utilities";
import { verifyContract } from "../../shared/helpers";

const logger = getLogger("scripts::runMigration");

enum GnosisSafeUrls {
  goerli = "https://safe-transaction.goerli.gnosis.io",
  mainnet = "https://safe-transaction.gnosis.io"
}

const confirmContinue = () => {
  let input = require('cli-interact').getYesNo;
  let val: boolean = input(`Continue?`);

  if (!val) {
    exit();
  }
}

const getEthAdapter = (signer: Signer) => {
  const ethAdapter = new EthersAdapter({
    ethers,
    signerOrProvider: signer
  });
  return ethAdapter;
}

const getSafeServiceInstance = async (signer: Signer) => {
  const ethAdapter = getEthAdapter(signer);
  const txServiceUrl = hre.network.name === "mainnet" ? GnosisSafeUrls.mainnet : GnosisSafeUrls.goerli;
  const safeService = new SafeServiceClient({ txServiceUrl, ethAdapter });
  return safeService;

}
const getSafeSdkInstance = async (signer: Signer, safeAddress: string) => {
  const ethAdapter = getEthAdapter(signer);
  const safeSdk = await Safe.create({ ethAdapter, safeAddress });
  return safeSdk;
}

/**
 * Attach to the Gnosis Safe SDK and create the transaction using the given 
 * data before being proposed
 * 
 * @param safeAddress The address of the safe
 * @param signer The transaction signer
 * @param contract The contract executing the given function
 * @param functionName The function to be executed
 * @param params The parameters given to the function to be executed
 */
const createAndProposeTransaction = async (
  safeAddress: string,
  signer: Signer,
  contract: ethers.Contract,
  functionName: string,
  params: any[],
) => {
  const safeSdk = await getSafeSdkInstance(signer, safeAddress);

  const functionFragment = contract.interface.functions[functionName];

  if (!functionFragment) {
    throw Error(`Function ${functionName} does not exist on contract at ${contract.address}`)
  }

  const data = contract.interface.encodeFunctionData(
    functionFragment,
    params
  );

  await proposeTransaction(safeSdk, signer, contract.address, data);
}

/**
 * @description Propose a transaction to the attached Gnosis safe
 * 
 * @param safeSdk The attached Gnosis safe 
 * @param ethAdapter The ethers adapter used for connecting to the chain
 * @param signer The transaction signer
 * @param to The 'to' address used in the transaction
 * @param data The encoded transaction data, gotten by using the contract interface "encodeFunctionData" function
 */
const proposeTransaction = async (
  safeSdk: Safe,
  signer: Signer,
  to: string,
  data: string,
) => {
  const safeService = await getSafeServiceInstance(signer);

  const nonce = await safeService.getNextNonce(safeSdk.getAddress())

  // Don't add nonce while testing because you can't run simulations on txs that it knows
  // have to follow others based on their nonce
  const safeTransactionData: SafeTransactionDataPartial = {
    to: to,
    data: data,
    value: "0",
    gasPrice: 1000000000, // 1 gwei
    safeTxGas: 60000,
    nonce: nonce
  }

  const safeTx = await safeSdk.createTransaction({ safeTransactionData });
  const safeTxHash = await safeSdk.getTransactionHash(safeTx);
  const signedSafeTxHash = await safeSdk.signTransactionHash(safeTxHash);

  await safeService.proposeTransaction({
    safeAddress: safeSdk.getAddress(),
    safeTransactionData: safeTx.data,
    safeTxHash: safeTxHash,
    senderAddress: await signer.getAddress(),
    senderSignature: signedSafeTxHash.data,
  });
}

// Maybe make each call to propose should be an an array and index you start at is step number?
// but how do we recontextualize? like if we need given addresses for something
export const runMigrationFromSafe = async (
  signer: SignerWithAddress,
  network: string
) => {
  const signerAddress = await signer.getAddress();
  const rootDomainId = "0";
  const waitBlocks = network === "hardhat" ? 0 : 3;

  logger.log(`Using network ${network} for migration`);

  // Will throw an error for a network that is not supported.
  // Supported networks are mainnet, goerli, and hardhat for development.
  const addresses = getAddressesForNetwork(network);

  // Get required contract addresses
  const defaultRegistrarAddress = addresses.registrar;
  const zNSHubAddress = addresses.zNSHub;
  const beaconAddress = addresses.subdomainBeacon;
  const wilderDomainId = addresses.wilderDomainId;
  const safeAddress = addresses.safe.address;

  // Connect to zNSHub for minting transactions below
  const zNSHub = ZNSHub__factory.connect(zNSHubAddress, signer);

  logger.log(`Deploying new Registrar with code changes for migration...`);

  const migrationRegistrarFactory = new MigrationRegistrar__factory(signer);

  // Deploy new version of Registrar that has appropriate code changes
  // required to migrate the domains
  let migrationRegistrar: MigrationRegistrar;

  if (network !== "mainnet") {
    // To save on deployment fees when testing we can reuse the deployed migration registrar
    const migrationRegistrarAddress = "0x9B4e6264Ddf4bF41d42EbA23155808f463075AfE";
    migrationRegistrar = migrationRegistrarFactory.attach(migrationRegistrarAddress);
  } else {
    migrationRegistrar = await migrationRegistrarFactory.deploy();
    await migrationRegistrar.deployTransaction.wait(waitBlocks);
  }

  logger.log(`Migration Registrar deployed to ${migrationRegistrar.address}`);

  // Check before verifying so we don't unintentionally fail on hardhat due to no etherscan
  // or on Goerli due to already having verified the contract from prior tests
  if (network === "mainnet") {
    logger.log(`Verifying on Etherscan...`);
    try {
      await verifyContract(migrationRegistrar.address);
    } catch (e) {
      logger.log("This contract may have already been verified, continuing...");
    }
  }

  // Get instance of Proxy Admin
  const proxyAdmin = await hre.upgrades.admin.getInstance();
  logger.log(`Proxy Admin is at ${proxyAdmin.address}`);

  logger.log("Comparing bytecode of Registrar and MigrationRegistrar for compatibility");
  logger.log(`Registrar Bytecode: ${new Registrar__factory(signer).bytecode.length / 2}`);
  logger.log(`MigrationRegistrar Bytecode: ${new MigrationRegistrar__factory(signer).bytecode.length / 2}`);

  logger.log("2. Upgrade existing proxies to have needed functionality");

  logger.log(`2a. Upgrade default registrar at ${defaultRegistrarAddress}?`);

  // Save these addresses for upgrading back to the original registrars at the end of this script
  const preMigrationRegistrarImpl = await hre.upgrades.erc1967.getImplementationAddress(defaultRegistrarAddress);
  const preMigrationBeaconRegistrarImpl = await hre.upgrades.beacon.getImplementationAddress(beaconAddress);

  confirmContinue();

  /**
   * ProxyAdmin.upgrade(proxyAddress, implementationAddress);
   * 
   * Proxy admin will upgrdae the proxy at `proxyAdress` to use
   * the new implementation contract at `implementationAddress`
   */
  await createAndProposeTransaction(
    safeAddress,
    signer,
    proxyAdmin,
    "upgrade(address,address)",
    [defaultRegistrarAddress, migrationRegistrar.address],
  );

  logger.log(`2b. Upgrade subdomain registrar at ${beaconAddress}?`);

  confirmContinue();

  const beaconFactory = await getUpgradeableBeaconFactory(hre, signer);
  const beacon = await beaconFactory.attach(beaconAddress);

  /**
   * Call Beacon.upgradeTo(implementationAddress);
   * 
   * Beacon will update the implementation image used for creating any
   * beacon proxies to use the new contract at `implementationAddress`
   */
  await createAndProposeTransaction(
    safeAddress,
    signer,
    beacon,
    "upgradeTo(address)",
    [migrationRegistrar.address],
  );

  logger.log("3. Burn root and wilder domains on default registrar?");
  confirmContinue();

  /**
   * Attaching to the given address with the MigrationRegistrar factory 
   * will assume that the above upgrade of the default registrar has been executed.
   * If we execute out of order transactions then below will fail as `burnDomains` does not
   * exist on that contract
   */
  const upgradedDefaultRegistrar = migrationRegistrarFactory.attach(defaultRegistrarAddress);

  let wilderOwner: string;
  let rootOwner: string;

  if (network === "mainnet") {
    // Management Account
    wilderOwner = "0x6aD1b4d3C39939F978Ea5cBaEaAD725f9342089C";
    // Deplyer 2
    rootOwner = "0x7829Afa127494Ca8b4ceEF4fb81B78fEE9d0e471";
  } else {
    // Astro Test
    wilderOwner = "0x35888AD3f1C0b39244Bb54746B96Ee84A5d97a53"
    rootOwner = "0x35888AD3f1C0b39244Bb54746B96Ee84A5d97a53"
  }

  /**
   * Call migrationRegistrar.burnDomains(domainIdA, domainIdB, ownerA, ownerB);
   * 
   * Will perform a transfer of both given token IDs from their respective owners to the
   * zero address.
   */
  await createAndProposeTransaction(
    safeAddress,
    signer,
    upgradedDefaultRegistrar,
    "burnDomains(uint256,uint256)",
    [wilderDomainId, rootDomainId, wilderOwner, rootOwner],
  );

  logger.log("4a. Deploy new root registrar as proxy to existing subdomain registrar beacon?");

  confirmContinue();

  // Attach at an already deployed address if we are just testing.
  // Otherwise, call to deploy a new beacon proxy
  let rootRegistrar: MigrationRegistrar;
  if (network !== "mainnet") {
    const rootRegistrarAddress = "0x539c41ea6297C9Af7195EdD743495E281E31DC97";
    rootRegistrar = migrationRegistrarFactory.attach(rootRegistrarAddress);
  } else {
    rootRegistrar = await hre.upgrades.deployBeaconProxy(
      beaconAddress,
      migrationRegistrarFactory,
      [
        hre.ethers.constants.AddressZero, // Parent registrar
        rootDomainId,
        "Zer0 Namespace Service",
        "ZNS",
        zNSHub.address
      ]
    ) as MigrationRegistrar;
    await rootRegistrar.deployTransaction.wait(waitBlocks);
  }

  if (network === "mainnet") {
    logger.log(`Verifying on Etherscan...`);
    try {
      await verifyContract(rootRegistrar.address);
    } catch (e) {
      logger.log("This contract may have already been verified, continuing...");
    }
  }

  logger.log(`New root registrar deployed to ${rootRegistrar.address}`);

  logger.log("4b. Register the new Registrar on zNSHub?");
  confirmContinue();

  /**
   * Call znsHub.addRegistrar(rootDomainId, registrarAddress);
   * 
   * Register the new registrar at `registrarAddress` with 
   * zNSHub to allow management of domains
   */
  await createAndProposeTransaction(
    safeAddress,
    signer,
    zNSHub,
    "addRegistrar(uint256,address)",
    [rootDomainId, rootRegistrar.address]
  );

  logger.log("5. Mint wilder in new root registrar?");

  confirmContinue();

  /**
   * Call rootRegistrar.mintDomain(parentDomainId,label,minter,metadataUri,royaltyAmount,locked,subdomainContract)
   * 
   * Will mint new domain with as `label` under `parentDomain`
   */
  await createAndProposeTransaction(
    safeAddress,
    signer,
    rootRegistrar,
    "mintDomain(uint256,string,address,string,uint256,bool,address)",
    [
      hre.ethers.constants.HashZero, // Parent domainId
      "wilder",
      signerAddress, // minter
      "ipfs://QmSQTLzzsPS67ay4SFKMv9Dq57iSQ7pLWQVUvS3XB5MowK/0",
      0,
      false,
      defaultRegistrarAddress
    ]
  );

  logger.log("6. Update the rootDomainId and parentRegistrar values on default registrar?");

  confirmContinue();

  await createAndProposeTransaction(
    safeAddress,
    signer,
    upgradedDefaultRegistrar,
    "setRootDomainIdAndParentRegistrar(uint256,address)",
    [
      rootDomainId,
      rootRegistrar.address
    ]
  );

  logger.log("7. Upgrade legacy and beacon registrars back to post-migration version (original registrar)");
  logger.log("7a. Upgrade default registrar back to original Registrar?");
  confirmContinue();

  /**
   * ProxyAdmin.upgrade(proxyAddress, implementationAddress);
   * 
   * Proxy admin will upgrade the proxy at `proxyAdress` to use
   * the new implementation contract at `implementationAddress`
   * 
   * This will upgrade to the original registrar version
   */
  await createAndProposeTransaction(
    safeAddress,
    signer,
    proxyAdmin,
    "upgrade(address,address)",
    [defaultRegistrarAddress, preMigrationRegistrarImpl]
  );

  logger.log("7b. Upgrade beacon registrars to original Registrar?");
  confirmContinue();

  /**
   * Call Beacon.upgradeTo(implementationAddress);
   * 
   * Beacon will update the implementation image used for creating any
   * beacon proxies to use the new contract at `implementationAddress`
   * 
   * This will upgrade to the original registrar version
   */
  await createAndProposeTransaction(
    safeAddress,
    signer,
    beacon,
    "upgradeTo(address)",
    [preMigrationBeaconRegistrarImpl]
  );

  logger.log(
    "Done. All transactions required for the root domain migration have\
    been proposed to the safe, in the order of execution"
  );

  return;
}
