import { Registrar__factory } from "../typechain";
import * as fs from "fs";

interface TransactionResponse {
  address: string;
  blockNumber: string;
  topics: string[];
  data: string;
}

interface Domain {
  parent: string;
  id: string;
  label: string;
  full?: string;
}

const domains: { [id: string]: Domain } = {};

async function main() {
  const events = JSON.parse(
    fs.readFileSync("output.json").toString()
  ) as TransactionResponse[];

  const factory = new Registrar__factory();

  const proxy = "0xc2e9678A71e50E5AEd036e00e9c5caeb1aC5987D";

  const registrar = factory.attach(proxy);

  for (const event of events) {
    const log = registrar.interface.parseLog(event);
    const parent = log.args["parent"].toString();
    const label = log.args["name"];
    const id = log.args["id"].toString();

    domains[id] = {
      id,
      parent,
      label,
    };
  }

  fs.writeFileSync("domains.json", JSON.stringify(domains, undefined, 2));

  console.log(domains);
}
main().catch(console.log);
