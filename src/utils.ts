import { BigNumber, BigNumberish, BytesLike, Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import { AbiCoder } from "@ethersproject/abi";
import { keccak256 } from "@ethersproject/keccak256";
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

const bancorRegistryAddresses = {
  rinkeby: "0xA6DB4B0963C37Bc959CbC0a874B5bDDf2250f26F",
  mainnet: "0x52Ae12ABe5D8BD778BD5397F99cA900624CfADD4",
};

async function getAccounts(signers: Signer[]) {
  const accs: string[] = [];
  for (const account of signers) {
    accs.push(await account.getAddress());
  }
  return accs;
}

const zeroBytes32 =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

const coder = new AbiCoder();

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

interface DynamicControllerData {
  reserveAddr: string;
  initWeight: BigNumberish;
  stepWeight: BigNumberish;
  minWeight: BigNumberish;
  mcapThreshold: BigNumberish;
  minBid: BigNumberish;
  name: string;
  symbol: string;
}

class ZeroSystem {
  registry: Registry;
  staking: StakingController;
  constructor(
    signerOrProvider: Provider | Signer,
    registry: string,
    stakingController: string,
    public dynamicTokenController: string
  ) {
    this.registry = Registry__factory.connect(registry, signerOrProvider);
    this.staking = StakingController__factory.connect(
      stakingController,
      signerOrProvider
    );
  }
  async controllerToStaking(
    id: BigNumberish,
    stakeToken: string,
    minBid: BigNumberish
  ) {
    const data = coder.encode(["address", "uint256"], [stakeToken, minBid]);
    return this.registry.safeSetController(id, this.staking.address, data);
  }
  async bidWithDynamicController(
    signer: Signer,
    domain: string,
    proposal: string,
    amt: BigNumberish,
    data: DynamicControllerData
  ) {
    return this.staking
      .connect(signer)
      .bid(
        domain,
        this.dynamicTokenController,
        this.encodeDynamicData(data),
        proposal,
        amt
      );
  }
  async claimBidWithDynamicController(
    signer: Signer,
    domain: string,
    owner: string,
    data: DynamicControllerData
  ) {
    return this.staking
      .connect(signer)
      .claimBid(
        domain,
        owner,
        this.dynamicTokenController,
        this.encodeDynamicData(data)
      );
  }
  encodeDynamicData({
    reserveAddr,
    initWeight,
    stepWeight,
    minWeight,
    mcapThreshold,
    minBid,
    name,
    symbol,
  }: DynamicControllerData) {
    return coder.encode(
      [
        "address",
        "uint32",
        "uint32",
        "uint32",
        "uint256",
        "uint256",
        "string",
        "string",
      ],
      [
        reserveAddr,
        initWeight,
        stepWeight,
        minWeight,
        mcapThreshold,
        minBid,
        name,
        symbol,
      ]
    );
  }
}

export {
  getAccounts,
  bancorRegistryAddresses,
  ZeroSystem,
  DynamicControllerData,
};
