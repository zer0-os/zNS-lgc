import { Registrar__factory } from "../typechain";

async function main() {
  const factory = new Registrar__factory();

  const proxy = "0xc2e9678A71e50E5AEd036e00e9c5caeb1aC5987D";

  const registrar = factory.attach(proxy);

  console.log(registrar.filters.DomainCreated());

  registrar.interface.events["Transfer(address,address,uint256)"];
}
main().catch(console.log);
