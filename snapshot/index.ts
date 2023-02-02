// Create a snapshot of contract state for zNS before a migration
import * as fs from "fs";
import { getDomains, Domain } from "./datastore";
import { getDomainOwners, DomainOwner } from "./subgraph";
import { getLogger } from "../utilities";
import * as ethers from "ethers";

const Web3 = require('web3');

// zNS Hub address
// 0x3F0d0a0051D1E600B3f6B35a07ae7A64eD1A10Ca

// Registrar addresses to try to read from
// Default Wilder Registrar (.wow, .kicks, .guild, .concept, .wheels, .cribs, .craft, .beasts, moto)
const defaultRegistrar = "0xc2e9678A71e50E5AEd036e00e9c5caeb1aC5987D";

require("dotenv");

const logger = getLogger("snapshot")

// Snapshot of zNS data
// Users who held in the past but currently have no domains are filtered
const main = async () => {

  // The datastore contains a list of all domains and each domain
  // has an 'owner' property that is read to verify parity with subgraph
  logger.log("Beginning snapshot of DataStore domains...")
  const domains: Domain[] = await getDomains();

  // The subgraph 
  logger.log("Beginning snapshot of Subgraph domain holders...")
  const domainOwners: DomainOwner[] = await getDomainOwners();

  logger.log("Reading from storage directly");
  const provider = new ethers.providers.JsonRpcProvider(process.env.INFURA_URL);
  const web3 = new Web3(process.env.INFURA_URL);

  /**
   * This loop takes a long time to run, but the results from ethers vs. web3 are identical.
   * What's confusing is, why are there only 6 non-zero values in a loop of 10,000?
   */
  for (let i = 0; i < 10000; i++) {
    const valueAtSlot = await provider.getStorageAt(defaultRegistrar, i);
    const valueAtSlotWeb3 = await web3.eth.getStorageAt(defaultRegistrar, i);
    if (valueAtSlot !== valueAtSlotWeb3) {
      logger.log(`Inequal values: ${valueAtSlot} :: ${valueAtSlotWeb3}`)
      continue;
    }
    if (!ethers.BigNumber.from(valueAtSlot).eq(0)) {
      logger.log(`${i}: ${valueAtSlot}`);
      logger.log(`${i}: ${valueAtSlotWeb3}`);
    }
  }

  const outputPath = "snapshot/output";

  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath);
  }

  fs.writeFileSync(outputPath + "/snapshot_1-26-2023_domain_holders_datastore.json", JSON.stringify(domains, null, 2))
  fs.writeFileSync(outputPath + "/snapshot_1-26-2023_domain_holders_subgraph.json", JSON.stringify(domainOwners, null, 2))
}

main()