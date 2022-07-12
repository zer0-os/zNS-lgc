import * as hre from "hardhat";
import { domainNameToId } from "../../test/helpers";
import { Registrar__factory, ZNSHub__factory } from "../../typechain";

const znsHubAddress = "0x3f0d0a0051d1e600b3f6b35a07ae7a64ed1a10ca";
const expectedDeployerAddress = "0xF5A37a4c139D639d04875f1945b59B1fA6cf939B";

const parentDomain = "wilder.moto";
const main = async () => {
  const signers = await hre.ethers.getSigners();
  const deployer = signers[0];

  if (deployer.address !== expectedDeployerAddress) {
    console.error(`wrong deployer!`);
    return;
  }

  const hub = ZNSHub__factory.connect(znsHubAddress, deployer);
  const parentDomainId = domainNameToId(parentDomain);
  const registrarAddress = await hub.subdomainRegistrars(parentDomainId);
  const registrar = Registrar__factory.connect(registrarAddress, deployer);

  const tx = await registrar.registerSubdomainContract(
    parentDomainId,
    "genesis",
    deployer.address,
    "ipfs://QmenxXLj2bp1f254xrdoi5dWtdEKjc8bRtUbrGKhdC3KuB",
    0,
    true,
    deployer.address
  );
};

main().catch(console.error);
