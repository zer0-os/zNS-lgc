import { expect, use } from "chai";
import { ethers, upgrades } from "hardhat";
import { solidity } from "ethereum-waffle";
import multihashing from "multihashing-async";
import { ZNSRegistry__factory, ZNSRegistry } from "../typechain";
import { Signer, BigNumber, BytesLike } from "ethers";
import { AbiCoder } from "@ethersproject/abi";
import { keccak256 } from "@ethersproject/keccak256";
import cid from "cids";
import ipfsClient from "ipfs-http-client";
import { readFileSync } from "fs";
import { getAccounts, calcId } from "../src/utils";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
use(solidity);

const coder = new AbiCoder();

// const ipfs = ipfsClient({
//   host: "ipfs.infura.io",
//   port: 5001,
//   protocol: "https",
//   headers: {
//     authorization: "Bearer " + process.env.INFURA_TOKEN,
//   },
// });

const zeroAddress = "0x0000000000000000000000000000000000000000";

const ethAddress = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

const infConvAddr = "0x0337184A497565a9bd8E300Dad50270Cd367F206";

const infAddress = "0xF56efd691C64Ef76d6a90D6b2852CE90FA8c2DCf";

const zeroBytes32 =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

const MAX_256 =
  "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF";

const ROOT_ID_HASH = keccak256(
  coder.encode(["uint256", "string"], [zeroBytes32, "ROOT"])
);

const ROOT_ID = BigNumber.from(ROOT_ID_HASH.toString()).toString();

describe("Domain", function () {
  let registry: ZNSRegistry;
  let signers: SignerWithAddress[];
  let accs: string[];
  let foo = calcId("foo");
  let foochild = calcId("foo.foochild");
  let bar = calcId("bar");
  let barchild = calcId("bar.barchild");
  let baz = calcId("baz");
  let bazchild = calcId("baz.bazchild");
  //let zeroImageCid: string;
  this.beforeAll(async function () {
    signers = await ethers.getSigners();
    accs = await getAccounts(signers);
    const rf = (await ethers.getContractFactory(
      "ZNSRegistry"
    )) as ZNSRegistry__factory;
    registry = (await upgrades.deployProxy(rf, [
      accs[0],
      zeroAddress,
    ])) as ZNSRegistry;
    await registry.deployed();

    //zeroImageCid = await ipfs
    //  .add(readFileSync("./scripts/zero-logo.png"))
    // .then((f) => f.cid.toV0());
  });

  it("root can create multiple domains = fails at create limit", async function () {
    const scltx = await registry.setChildCreateLimit(0, 1);
    const footx = await registry.createDomain(
      ROOT_ID,
      "foo",
      accs[0],
      zeroAddress
    );
    //await expect(
    await expect(
      registry.createDomain(ROOT_ID, "bar", accs[0], zeroAddress)
    ).to.revertedWith("");
    await expect(registry.setChildCreateLimit(0, 0)).to.revertedWith("");
    await expect(registry.setChildCreateLimit(0, 1)).to.revertedWith("");
    await registry.setChildCreateLimit(0, 3);
    await registry.createDomain(ROOT_ID, "bar", accs[0], zeroAddress);
    await registry.createDomain(ROOT_ID, "baz", accs[0], zeroAddress);
    await expect(
      registry.createDomain(foo, "foochild", accs[0], zeroAddress)
    ).to.revertedWith("");
    await registry.setChildCreateLimit(ROOT_ID, 5);
    await registry.createDomain(foo, "foochild", accs[0], zeroAddress);
    await registry.createDomain(bar, "barchild", accs[0], zeroAddress);
    const [s, f] = await Promise.all(
      [scltx, footx].map((x) => x.wait(1).then((x) => x.gasUsed.toString()))
    );
    console.log("setChildCreateLimit gas", s, "\ncreateDomain gas", f);
  });
  it("root owner is controllerLike", async function () {
    await registry.setController(ROOT_ID, signers[1].address);
    expect(await registry.controllerOf(ROOT_ID)).to.equal(signers[1].address);
    expect(await registry.controllerLikeOf(signers[0].address, ROOT_ID)).eq(
      true
    );
  });
  it("non-root owner is controllerLike if controller zero", async function () {
    expect(await registry.controllerLikeOf(signers[0].address, foo));
  });
  it("non-root owner is not controllerLike if controller another address", async function () {
    await registry.setController(foo, signers[1].address);
    expect(await registry.controllerOf(foo)).to.equal(signers[1].address);
    expect(await registry.controllerLikeOf(signers[0].address, foo)).to.eq(
      false
    );
  });
  it("setting lockablePropertiesRule forbids changes after set", async function () {
    await registry.setLockableProperties(foochild, "foobar");
    await registry.setLockableProperties(foochild, "foobar1");
    await registry.setChildLockablePropertiesRule(bar, 1);
    await registry.setChildLockablePropertiesRule(foo, 1);
    await registry.setLockableProperties(barchild, "barfoo");
    await expect(
      registry.setLockableProperties(foochild, "foobar2")
    ).to.revertedWith("");
    await expect(
      registry.setLockableProperties(barchild, "barfoo2")
    ).to.revertedWith("");
  });
});
