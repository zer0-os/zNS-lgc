// Create a snapshot of contract state for zNS before a migration
import * as fs from "fs";
import { createClient, getDomainOwners } from "./helpers";
import { DomainHolder } from "./types";

require("dotenv");

const main = async () => {
  const client = createClient(process.env.SUBGRAPH_URI!);

  // Snapshot all domain owners and their domains
  // Users who held in the past but currently have no domains are filtered
  const allDomainHolders: DomainHolder[] = await getDomainOwners(client);

  const outputPath = "snapshot/output";

  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath);
  }

  fs.writeFileSync(outputPath + "/snapshot_1-20-2023_domain_holders.json", JSON.stringify(allDomainHolders, null, 2))
}

main()