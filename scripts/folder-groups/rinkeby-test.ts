import { ethers } from "ethers";
import * as hre from "hardhat";
import { domainNameToId } from "../../test/helpers";
import { Registrar__factory, ZNSHub__factory } from "../../typechain";

// rinkeby
const registrarAddress = "0xa4F6C921f914ff7972D7C55c15f015419326e0Ca";
const hubAddress = "0x90098737eB7C3e73854daF1Da20dFf90d521929a";
const deployerAddress = "0x35888AD3f1C0b39244Bb54746B96Ee84A5d97a53";

const folderUri = "ipfs://QmeZB47dFzBu4CNg6FqZCtX79Ezoop8429UXDQtpmqCRPc/";
const parentName = "wilder.candy.meow";
const parentId = domainNameToId(parentName);

const main = async () => {
  let deployer = (await hre.ethers.getSigners())[0];
  const hub = ZNSHub__factory.connect(hubAddress, deployer);
  let tx: ethers.ContractTransaction | undefined;

  if ((await hre.ethers.provider.getNetwork()).chainId == 31337) {
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [deployerAddress],
    });

    deployer = await hre.ethers.getSigner(deployerAddress);

    await hre.network.provider.send("hardhat_setBalance", [
      deployerAddress,
      "0x56BC75E2D63100000", // some big number
    ]);
  }

  if (deployer.address != deployerAddress) {
    throw Error(
      `Deployer is not the correct account given=${deployer.address} expected=${deployerAddress}`
    );
  }

  // make controller if not already
  if (!(await hub.isController(deployer.address))) {
    tx = await hub.addController(deployer.address);
    await tx.wait();
  }

  // create parent if it doesn't already exist
  if (!(await hub.domainExists(parentId))) {
    const parentOfParent = parentName.substr(0, parentName.lastIndexOf("."));
    const parentOfParentId = domainNameToId(parentOfParent);
    const parentRegistrar = Registrar__factory.connect(
      await hub.getRegistrarForDomain(parentOfParentId),
      deployer
    );
    const parentOfParentLabel = parentName.substr(
      parentName.lastIndexOf(".") + 1,
      parentName.length - parentName.lastIndexOf(".") + 1
    );

    console.log(`creating parent domain as subdomain contract`);
    tx = await parentRegistrar.registerSubdomainContract(
      parentOfParentId,
      parentOfParentLabel,
      deployer.address,
      `${folderUri}0`,
      0,
      true,
      deployer.address
    );
    await tx.wait();
  }

  const registrar = Registrar__factory.connect(
    await hub.subdomainRegistrars(parentId),
    deployer
  );

  // make new group
  console.log(`creating domain group`);
  tx = await registrar.createDomainGroup(folderUri);
  await tx.wait();

  const groupId = await registrar.numDomainGroups();
  console.log(`domain group is #${groupId}`);

  // create domains
  console.log(`registering domains in domain group`);
  tx = await registrar.registerDomainInGroupBulk(
    parentId,
    groupId,
    0,
    0,
    10,
    deployer.address,
    0,
    deployer.address
  );
  await tx.wait();
};

main().catch(console.error);
