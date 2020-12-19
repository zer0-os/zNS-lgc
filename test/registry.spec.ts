import { expect, use } from "chai";
import { ethers } from "hardhat";
import { solidity } from "ethereum-waffle";
import { Registrar__factory, Registrar } from "../typechain";
import { Signer } from "ethers";
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
  it("validate string", async function () {
    console.log(await registrar.validateString('foo\\"'));
    console.log(await registrar.validateString('foo.bar.baz"'));
    console.log(await registrar.validateString("foo"));
    console.log(await registrar.validateString("foo.bar.baz"));
    const ih = await registrar.getIpfsHash("foo.bar.baz");
    console.log(ih);
    console.log(Number(ih.toString()).toString(58));

    // expect(await registrar.validateString('foo\\"')).to.eq(true)
    // expect(await registrar.validateString('foo"')).to.eq(false)
  });
  it("registrar owner has root point", async function () {
    expect(await registrar.ownerOf(0)).to.eq(accs[0]);
    expect((await registrar.entries(0)).controller).to.eq(accs[0]);
    await registrar.transferFrom(accs[0], accs[1], 0);
    expect((await registrar.entries(0)).controller).to.eq(accs[1]);
  });
  it("registrar owner can spawn multiple domains and subdomains", async function () {
    await registrar.createRegistry(0, "foo", accs[0], accs[0], "someref0");
    const id0 = await registrar.getId(["foo"]);
    await registrar.createRegistry(id0, "bar", accs[0], accs[0], "someref1");
    const id1 = await registrar.getId(["foo", "bar"]);
    await registrar.createRegistry(id0, "baz", accs[0], accs[0], "someref2");
    const id2 = await registrar.getId(["foo", "baz"]);
    expect((await registrar.entries(id0)).controller).to.eq(accs[0]);
    expect((await registrar.entries(id1)).controller).to.eq(accs[0]);
    expect((await registrar.entries(id2)).controller).to.eq(accs[0]);
    await registrar.createRegistry(
      0,
      "community",
      accs[0],
      accs[0],
      "someref3"
    );
    const id3 = await registrar.getId(["community"]);
    await registrar.createRegistry(id3, "dao", accs[0], accs[0], "someref4");
    const id4 = await registrar.getId(["community", "dao"]);
    await registrar.createRegistry(id3, "token", accs[0], accs[0], "someref4");
    const id5 = await registrar.getId(["community", "token"]);
    expect((await registrar.entries(id3)).controller).to.eq(accs[0]);
    expect((await registrar.entries(id4)).controller).to.eq(accs[0]);
    expect((await registrar.entries(id5)).controller).to.eq(accs[0]);
  });
  it("registrar owner has root point", async function () {
    expect(await registrar.ownerOf(0)).to.eq(accs[0]);
    expect((await registrar.entries(0)).controller).to.eq(accs[0]);
    await registrar.transferFrom(accs[0], accs[1], 0);
    expect((await registrar.entries(0)).controller).to.eq(accs[1]);
  });
});
