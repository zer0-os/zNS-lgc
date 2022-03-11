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
const fs = __importStar(require("fs"));
const utilities_1 = require("../utilities");
const logger = utilities_1.getLogger("scripts::upload-nft");
const ipfsBaseUri = "https://ipfs.io/ipfs/";
const imagePath = "../wilderworld.png";
const nftName = "Wilder World";
const nftDescription = "Wilder World - Root";
async function main() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const createClient = require("ipfs-http-client");
    const client = createClient("https://ipfs.infura.io:5001");
    const imageContent = fs.readFileSync(imagePath);
    logger.log(`uploading image`);
    const imageEntry = await client.add(imageContent);
    logger.log(`image cid: ${imageEntry.cid}`);
    const nftMetadata = {
        image: `${ipfsBaseUri}${imageEntry.cid}`,
        description: nftDescription,
        name: nftName,
    };
    logger.log(`uploading json`);
    const content = JSON.stringify(nftMetadata);
    const entry = await client.add(content);
    logger.log(`json cid: ${entry.cid}`);
    logger.log(`metadata uri: ${ipfsBaseUri}${entry.cid}`);
}
main();
