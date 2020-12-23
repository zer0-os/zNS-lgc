import { expect, use } from "chai";
import { ethers } from "hardhat";
import { solidity } from "ethereum-waffle";
import multihashing from "multihashing-async";
import { Registrar__factory, Registrar } from "../typechain";
import { Signer } from "ethers";
import cid from "cids";
import { getAccounts } from "../src/utils";
use(solidity);

describe("registry", function () {
  let registrar: Registrar;
  let signers: Signer[];
  let accs: string[];
  this.beforeAll(async function () {
    signers = await ethers.getSigners();
    accs = await getAccounts(signers);
    const factory = (await ethers.getContractFactory(
      "Registrar"
    )) as Registrar__factory;
    registrar = await factory.deploy(accs[0]);
    await registrar.deployed();
  });
  it("validate domain", async function () {
    expect((await registrar.validateDomain('foo\\"')).valid).to.eq(false);
    expect((await registrar.validateDomain('foo.bar.baz"')).valid).to.eq(false);
    expect((await registrar.validateDomain("foo")).valid).to.eq(true);
    expect((await registrar.validateDomain("foo.bar.baz")).valid).to.eq(true);
  });

  it("registrar owner can create multiple domains and subdomains", async function () {
    await registrar.createRegistry("foo", accs[0], accs[0], "someref0");
    const id0 = await registrar.getId(["foo"]);
    await registrar.createRegistry("foo.bar", accs[0], accs[0], "someref1");
    const id1 = await registrar.getId(["foo", "bar"]);
    await registrar.createRegistry("foo.baz", accs[0], accs[0], "someref2");
    const id2 = await registrar.getId(["foo", "baz"]);
    expect((await registrar.entries(id0)).controller).to.eq(accs[0]);
    expect((await registrar.entries(id1)).controller).to.eq(accs[0]);
    expect((await registrar.entries(id2)).controller).to.eq(accs[0]);

    await registrar.createRegistry("community", accs[0], accs[0], "someref3");
    const id3 = await registrar.getId(["community"]);
    await registrar.createRegistry(
      "community.dao",
      accs[0],
      accs[0],
      "someref4"
    );
    const id4 = await registrar.getId(["community", "dao"]);
    await registrar.createRegistry(
      "community.token",
      accs[0],
      accs[0],
      "someref4"
    );
    const id5 = await registrar.getId(["community", "token"]);
    const txr = await registrar.createRegistry(
      "community.token.trad",
      accs[0],
      accs[0],
      "someref5"
    );
    const id6 = await registrar.getId(["community", "token", "trad"]);
    expect((await registrar.entries(id3)).controller).to.eq(accs[0]);
    expect((await registrar.entries(id4)).controller).to.eq(accs[0]);
    expect((await registrar.entries(id5)).controller).to.eq(accs[0]);
    const entry6 = await registrar.entries(id6);
    expect(entry6.parent).to.eq(id5);
  });
  it("create ipfs hash", async function () {
    const id6 = await registrar.getId(["community", "token", "trad"]);
    const uri = await registrar.tokenUri(id6);
    const data = JSON.stringify({name: "community.token.trad"})
    const hash = await multihashing(Buffer.from(data, "utf8"), "sha2-256");
    const c = new cid(1, "raw", hash);
    expect(uri).to.eq(c.toV1().toString());
  });

  it("registrar owner has root", async function () {
    expect(await registrar.ownerOf(0)).to.eq(accs[0]);
    expect((await registrar.entries(0)).controller).to.eq(accs[0]);
    await registrar.transferFrom(accs[0], accs[1], 0);
    expect((await registrar.entries(0)).controller).to.eq(accs[1]);
  });
});
