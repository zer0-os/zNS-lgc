import { expect, use } from "chai";
import { ethers } from "hardhat";
import { solidity } from "ethereum-waffle";
import multihashing from "multihashing-async";
import { Registry__factory, Registry } from "../typechain";
import { Signer, BigNumber } from "ethers";
import { AbiCoder } from "@ethersproject/abi";
import { keccak256 } from "@ethersproject/keccak256";
import cid from "cids";
import ipfsClient from "ipfs-http-client";
import { readFileSync } from "fs";
import { getAccounts } from "../src/utils";
use(solidity);

const coder = new AbiCoder();

const zeroBytes32 =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

const ROOT_ID_HASH = keccak256(
  coder.encode(["uint256", "string"], [zeroBytes32, "ROOT"])
);

const ROOT_ID = BigNumber.from(ROOT_ID_HASH.toString()).toString();

function getDomainId(_domain: string): string {
  if (_domain === "ROOT") {
    return ROOT_ID;
  }
  const domains = _domain.split(".");
  let hash = ROOT_ID_HASH;
  for (const domain of domains) {
    hash = keccak256(coder.encode(["uint256", "string"], [hash, domain]));
  }
  return BigNumber.from(hash).toString();
}

const ipfs = ipfsClient({
  host: "ipfs.infura.io",
  port: 5001,
  protocol: "https",
  headers: {
    authorization: "Bearer " + process.env.INFURA_TOKEN,
  },
});

describe("Domain", function () {
  let registry: Registry;
  let signers: Signer[];
  let accs: string[];
  let zeroImageCid: string;
  this.beforeAll(async function () {
    signers = await ethers.getSigners();
    accs = await getAccounts(signers);
    const factory = (await ethers.getContractFactory(
      "Registry"
    )) as Registry__factory;
    registry = await factory.deploy(
      accs[0],
      accs[0],
      "ipfs://Qm...",
      "ipfs://Qm..."
    );
    await registry.deployed();
    zeroImageCid = await ipfs
      .add(readFileSync("./scripts/zero-logo.png"))
      .then((f) => f.cid.toV0());
  });
  it("validate domain", async function () {
    expect((await registry.validateDomain('foo\\"')).valid).to.eq(false);
    expect((await registry.validateDomain('foo.bar.baz"')).valid).to.eq(false);
    expect((await registry.validateDomain("foo")).valid).to.eq(true);
    expect((await registry.validateDomain("foo.bar.baz")).valid).to.eq(true);
  });

  it("registry owner can create multiple domains and subdomains", async function () {
    await registry.createDomain(
      "foo",
      accs[0],
      accs[0],
      "ipfs://Qmresolver",
      "ipfs://Qmimage"
    );

    const id0 = await registry.getId(["foo"]);
    await registry.createDomain(
      "foo.bar",
      accs[0],
      accs[0],
      "ipfs://Qmresolver",
      "ipfs://Qmimage"
    );

    const id1 = await registry.getId(["foo", "bar"]);
    await registry.createDomain(
      "foo.baz",
      accs[0],
      accs[0],
      "ipfs://Qmresolver",
      "ipfs://Qmimage"
    );
    const id2 = await registry.getId(["foo", "baz"]);
    expect((await registry.entries(id0)).controller).to.eq(accs[0]);
    expect((await registry.entries(id1)).controller).to.eq(accs[0]);
    expect((await registry.entries(id2)).controller).to.eq(accs[0]);

    await registry.createDomain(
      "community",
      accs[0],
      accs[0],
      "ipfs://Qmresolver",
      "ipfs://Qmimage"
    );
    const id3 = await registry.getId(["community"]);
    await registry.createDomain(
      "community.dao",
      accs[0],
      accs[0],
      "ipfs://Qmresolver",
      "ipfs://Qmimage"
    );
    const id4 = await registry.getId(["community", "dao"]);
    await registry.createDomain(
      "community.token",
      accs[0],
      accs[0],
      "ipfs://Qmresolver",
      "ipfs://Qmimage"
    );
    const id5 = await registry.getId(["community", "token"]);
    const txr = await registry.createDomain(
      "community.token.trad",
      accs[0],
      accs[0],
      "ipfs://Qmresolver",
      "ipfs://Qmimage"
    );
    const id6 = await registry.getId(["community", "token", "trad"]);
    expect((await registry.entries(id3)).controller).to.eq(accs[0]);
    expect((await registry.entries(id4)).controller).to.eq(accs[0]);
    expect((await registry.entries(id5)).controller).to.eq(accs[0]);
    const entry6 = await registry.entries(id6);
    expect(entry6.parent).to.eq(id5);
  });
  it("create ipfs hash", async function () {
    const id6 = await registry.getId(["community", "token", "trad"]);
    const uri = await registry.tokenURI(id6);
    const data = JSON.stringify({ name: "community.token.trad" });
    const hash = await multihashing(Buffer.from(data, "utf8"), "sha2-256");
    const c = new cid(1, "raw", hash);
    // ipfs://bafkreih6w6omp5vggawnyif6wbfidn4t74k32ks37osxtrftefi3fjsiw4
    // foo: bafkreic5zkc6o2mj4vplxxwj4uyeqmwankpk24jywbbxfrsvkmadz7jije
    expect(uri).to.eq("ipfs://" + c.toV1().toString());
  });

  it("registry owner has root", async function () {
    expect(await registry.ownerOf(ROOT_ID)).to.eq(accs[0]);
    expect((await registry.entries(ROOT_ID)).owner).to.eq(accs[0]);
    await registry.transferFrom(accs[0], accs[1], ROOT_ID);
    expect((await registry.entries(ROOT_ID)).owner).to.eq(accs[1]);
  });
});
