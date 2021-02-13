import { expect, use } from "chai";
import { ethers, upgrades } from "hardhat";
import { solidity } from "ethereum-waffle";
import multihashing from "multihashing-async";
import {
  Registry__factory,
  Registry,
  StakingController,
  StakingController__factory,
  DynamicTokenController,
  DynamicTokenController__factory,
  DSTokenProxyable__factory,
  DynamicLiquidTokenConverterProxyable__factory,
  BancorNetwork,
  BancorNetwork__factory,
  ERC20Token,
  ERC20Token__factory,
  DynamicLiquidTokenConverter,
  DynamicLiquidTokenConverter__factory,
} from "../typechain";
import { Signer, BigNumber } from "ethers";
import { AbiCoder } from "@ethersproject/abi";
import { keccak256 } from "@ethersproject/keccak256";
import cid from "cids";
import ipfsClient from "ipfs-http-client";
import { readFileSync } from "fs";
import {
  getAccounts,
  bancorRegistryAddresses,
  ZeroSystem,
  DynamicControllerData,
} from "../src/utils";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
use(solidity);

const coder = new AbiCoder();

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

const getInfinity = async (
  signer: Signer,
  bancor: BancorNetwork,
  conv: DynamicLiquidTokenConverter,
  infAddress: string
) => {
  const ethAmt = BigNumber.from(10).pow(18).mul(20);
  const amt = await conv.getReturn(ethAddress, infAddress, ethAmt);
  const minAmt = ethAmt.sub(BigNumber.from(10).pow(18).mul(19));
  return bancor
    .connect(signer)
    .convertByPath(
      [ethAddress, infAddress, infAddress],
      ethAmt,
      minAmt,
      zeroAddress,
      zeroAddress,
      0,
      { value: ethAmt }
    );
};

describe("Staking", function () {
  let registry: Registry;
  let signers: SignerWithAddress[];
  let staking: StakingController;
  let dynamic: DynamicTokenController;
  let bancor: BancorNetwork;
  let accs: string[];
  let infinity: ERC20Token;
  let infConv: DynamicLiquidTokenConverter;
  let zero: ZeroSystem;
  this.beforeAll(async function () {
    this.timeout(100000);
    signers = await ethers.getSigners();
    accs = await getAccounts(signers);
    const rf = (await ethers.getContractFactory(
      "Registry"
    )) as Registry__factory;
    registry = (await upgrades.deployProxy(rf, [
      accs[0],
      accs[0],
      "",
      256,
    ])) as Registry;
    await registry.deployed();
    const scf = (await ethers.getContractFactory(
      "StakingController"
    )) as StakingController__factory;
    const dtcf = (await ethers.getContractFactory(
      "DynamicTokenController"
    )) as DynamicTokenController__factory;
    staking = (await upgrades.deployProxy(scf, [
      registry.address,
      bancorRegistryAddresses.mainnet,
    ])) as StakingController;
    const tokenImplF = (await ethers.getContractFactory(
      "DSTokenProxyable"
    )) as DSTokenProxyable__factory;
    const convImplF = (await ethers.getContractFactory(
      "DynamicLiquidTokenConverterProxyable"
    )) as DynamicLiquidTokenConverterProxyable__factory;
    const tokenImpl = await tokenImplF.deploy();
    await tokenImpl.deployed();
    const convImpl = await convImplF.deploy();
    await convImpl.deployed();
    dynamic = (await upgrades.deployProxy(dtcf, [
      tokenImpl.address,
      convImpl.address,
      staking.address,
      registry.address,
      bancorRegistryAddresses.mainnet,
    ])) as DynamicTokenController;
    await dynamic.deployed();
    const netAddress = await staking.bancorNetwork();
    bancor = BancorNetwork__factory.connect(netAddress, signers[0]);
    infinity = ERC20Token__factory.connect(infAddress, signers[0]);
    infConv = DynamicLiquidTokenConverter__factory.connect(
      infConvAddr,
      signers[0]
    );
    zero = new ZeroSystem(
      signers[0],
      registry.address,
      staking.address,
      dynamic.address
    );
    console.log("addresses", {
      infinity: infinity.address,
      registry: registry.address,
      staking: staking.address,
      dynamic: dynamic.address,
    });
  });
  it("get some infinity", async function () {
    await getInfinity(signers[1], bancor, infConv, infinity.address);
    const bal = await infinity.balanceOf(signers[1].address);
    console.log("balance", bal.toString());
    expect(bal).to.gt(0);
  });
  it("setup staking controller for root", async function () {
    await zero.controllerToStaking(
      ROOT_ID,
      infinity.address,
      BigNumber.from(10).pow(18)
    );
    console.log("stakingcontroller", staking.address);
    console.log("controllerof", await registry.controllerOf(ROOT_ID));
  });
  it("do stake with zero addr controller and accept and claim", async function () {
    const _staking = staking.connect(signers[1]);
    expect(
      _staking.bid(
        "zero",
        zeroAddress,
        "0x",
        "Qm....",
        BigNumber.from(10).pow(3)
      )
    ).to.revertedWith("");
    await infinity.connect(signers[1]).approve(staking.address, MAX_256);
    await _staking.bid(
      "zero",
      zeroAddress,
      "0x",
      "Qm....",
      BigNumber.from(10).pow(18)
    );
    await staking.acceptBid(signers[1].address, getDomainId("zero"), ROOT_ID);
    await _staking.claimBid("zero", signers[1].address, zeroAddress, "0x");
    console.log("signer1", signers[1].address);
    console.log("owner of zero", await registry.ownerOf(getDomainId("zero")));
  });
  it("do stake with dynamic token controller and accept and claim", async function () {
    const _staking = staking.connect(signers[1]);
    expect(
      _staking.bid(
        "wilder",
        zeroAddress,
        "0x",
        "Qm....",
        BigNumber.from(10).pow(3)
      )
    ).to.revertedWith("");
    await infinity.connect(signers[1]).approve(staking.address, MAX_256);
    // await _staking.bid(
    //   "wilder",
    //   zeroAddress,
    //   "0x",
    //   "Qm....",
    //   BigNumber.from(10).pow(18)
    // );
    const data: DynamicControllerData = {
      reserveAddr: infinity.address,
      initWeight: 9000,
      stepWeight: 10000,
      minWeight: 3000,
      mcapThreshold: "111000000000000000000",
      minBid: BigNumber.from(10).pow(18),
      name: "Wilder",
      symbol: "WLD",
    };
    console.log("wilder id", getDomainId("wilder"));
    const bidtx = await zero.bidWithDynamicController(
      signers[1],
      "wilder",
      "qm...",
      BigNumber.from(10).pow(18),
      data
    );
    const acceptx = await staking.acceptBid(
      signers[1].address,
      getDomainId("wilder"),
      ROOT_ID
    );
    const claimtx = await zero.claimBidWithDynamicController(
      signers[1],
      "wilder",
      signers[1].address,
      data
    );
    console.log("signer1", signers[1].address);
    console.log(
      "owner of wilder",
      await registry.ownerOf(getDomainId("wilder"))
    );
    const imagetx = await registry
      .connect(signers[1])
      .setImage(
        getDomainId("wilder"),
        "qmagbegubgeurbghebguerbguerbgergergerg"
      );
    const [b, a, c, i] = await Promise.all(
      [bidtx, acceptx, claimtx, imagetx].map((x) =>
        x.wait(1).then((x) => x.gasUsed.toString())
      )
    );

    console.log("bid gas", b);
    console.log("accept gas", a);
    console.log("claim gas", c);
    console.log("image gas", i);
  });
});
