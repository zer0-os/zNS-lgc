import * as hre from "hardhat";
import { Registrar__factory, ZNSHub__factory } from "../../typechain";

/*
Script to upgrade (and test) zNS Registrar to v1.1

- Deploys a zNS Registrar Beacon (used by beacon proxies)
  - We need this because sub domain registrars will use the beacon
- Deploys the zNS Hub
- Upgrades the existing zNS Registrar

If you get a `Deployment at address 0xA677906024550c800fa881FDD638AaBd5a7E5b09 is not registered` error
then make sure to copy/paste `./.openzeppelin/mainnet.json` and rename it to `./.openzeppelin/unknown-31337.json`

*/

//0x90098737eB7C3e73854daF1Da20dFf90d521929a

// Rinkeby Registrar
const registrarAddress = "0xa4F6C921f914ff7972D7C55c15f015419326e0Ca";

const main = async () => {
  let deployer = (await hre.ethers.getSigners())[0];

  await hre.upgrades.upgradeProxy(
    "0x90098737eB7C3e73854daF1Da20dFf90d521929a",
    new ZNSHub__factory(deployer)
  );

  // Upgrade the existing registrar
  console.log(`Upgrading existing zNS Registrar`);
  await hre.upgrades.upgradeProxy(
    registrarAddress,
    new Registrar__factory(deployer)
  );
};

main().catch(console.error);
