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
  const deployer = (await hre.ethers.getSigners())[0];
  const hub = ZNSHub__factory.connect(hubAddress, deployer);

  const registrar = Registrar__factory.connect(
    await hub.subdomainRegistrars(parentId),
    deployer
  );

  // create parent if it doesn't already exist
  if (!(await hub.domainExists(parentId))) {
  }

  // make new group
  await registrar.createDomainGroup(folderUri);
  const groupId = await registrar.numDomainGroups();

  // create domains
  await registrar.registerDomainInGroupBulk(
    parentId,
    groupId,
    0,
    0,
    10,
    deployer.address,
    0,
    deployer.address
  );
};

main().catch(console.error);
