import * as hre from "hardhat";
import { SampleSale__factory, ZNFTUpgradeable__factory } from "../typechain";
import { deployZNS } from "./shared/deploy";
import { getLogger } from "../utilities";
import { BigNumber } from "ethers";

const logger = getLogger("zerc");

const main = async () => {
  const [deployer, minter] = await hre.ethers.getSigners();

  logger.log(`Deployer is ${deployer.address}`);

  // have to make sure we register the zerc contract as a controller on hub
  const contracts = await deployZNS(hre.network.name, deployer, logger);
  const registrar = contracts.registrar;
  const hub = contracts.zNSHub;

  // Add controller
  await hub.connect(deployer).addController(deployer.address);

  const domainName = "Wapes";
  const domainMetadata = "ipfs://QmXgAiVDti99w1FTTS2vR7CnATP8n39LMfbaeJpfhmzhrc/";

  // Register a domain
  const tx = await registrar.connect(deployer).registerDomain(
    hre.ethers.constants.HashZero,
    domainName,
    deployer.address,
    domainMetadata,
    0,
    false
  );

  const receipt = await tx.wait();

  if (!receipt.events) throw Error("No events");

  const [transfer] = receipt.events.filter((event) => {
    if (event.event === "Transfer") return event;
  });

  if (!transfer) throw Error("No transfer event")

  // Get token ID
  const domainId = transfer.args![transfer.args!.length - 1];

  logger.log(`Domain ${domainName} has id ${domainId}`);

  const znftFactory = new ZNFTUpgradeable__factory(deployer);
  const znft = await znftFactory.deploy();

  await znft.deployed();

  logger.log(`ZNFT Deployed to ${znft.address}`);

  // Initialize with no parent domain
  await znft.initialize(
    "Zero NFT",
    "ZNFT",
    domainMetadata,
    registrar.address,
    hre.ethers.constants.HashZero
  );

  logger.log(`ZNFT Using Registrar at: ${registrar.address}`);

  const base = await znft.baseURI();
  logger.log(`ZNFT Base URI: ${base}`);


  await znft.connect(deployer).addController(deployer.address);
  logger.log(`Add ${deployer.address} as controller`);

  const mintTx = await znft.connect(deployer).mint(minter.address, 1);
  const mintReceipt = await mintTx.wait();

  if (!mintReceipt.events) throw Error("Did not transfer");

  const [transferEvent] = mintReceipt.events.filter(event => {
    return event.event === "Transfer"
  });

  const tokenId: BigNumber = transferEvent.args![transferEvent.args!.length - 1];
  const index = await znft.indexes(tokenId);
  logger.log(`Token Index: ${index}`);
  const tokenUri = await znft.tokenURI(tokenId);
  logger.log(`TokenURI: ${tokenUri}`);


  // Call to mint through sale contract
  const saleFactory = new SampleSale__factory(deployer);
  const sale = await saleFactory.deploy();

  await sale.deployed();

  await sale.initialize(
    hre.ethers.constants.HashZero,
    hre.ethers.utils.parseEther("1"),
    znft.address,
    deployer.address,
    0,
    100,
    "0x3201e832be1a50488b1b4a1f349980a8316d9c6eaf306520de7e6c16751ab086",
    1,
    1,
    3
  )

  const owner = await sale.owner();
  logger.log(`Sale Owner: ${owner}`)

  await znft.connect(deployer).addController(sale.address);
  logger.log(`Add ${sale.address} as controller to zNFT`);

  const adminMintTx = await sale.connect(deployer).adminMint(1);

  const adminMintReceipt = await adminMintTx.wait();

  if (!adminMintReceipt.events) throw Error("No events");

  const [adminMintTransferEvent] = mintReceipt.events.filter(event => {
    return event.event === "Transfer"
  });

  const adminTokenId: BigNumber = adminMintTransferEvent.args![transferEvent.args!.length - 1];

  const ownerOfToken = await znft.ownerOf(adminTokenId);
  logger.log(`Owner of admin token should be admin ${ownerOfToken}`);


  // logger.log(`Minted token: ${tokenId}`);
  // logger.log(`Owner of minted token: ${ownerOfToken}`);


};

main().catch(console.error);
