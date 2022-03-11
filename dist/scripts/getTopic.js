"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typechain_1 = require("../typechain");
async function main() {
    const factory = new typechain_1.Registrar__factory();
    const proxy = "0xc2e9678A71e50E5AEd036e00e9c5caeb1aC5987D";
    const registrar = factory.attach(proxy);
    console.log(registrar.filters.DomainCreated());
    registrar.interface.events["DomainCreated(uint256,string,uint256,uint256,address,address,string,uint256)"];
}
main().catch(console.log);
