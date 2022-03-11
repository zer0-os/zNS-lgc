"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const typechain_1 = require("../typechain");
const fs = __importStar(require("fs"));
const domains = {};
async function main() {
    const events = JSON.parse(fs.readFileSync("output.json").toString());
    const factory = new typechain_1.Registrar__factory();
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
