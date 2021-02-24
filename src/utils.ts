import { BigNumber, BigNumberish, BytesLike, Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import { AbiCoder } from "@ethersproject/abi";
import { keccak256 } from "@ethersproject/keccak256";
import {
  ZNSRegistry__factory,
  ZNSRegistry,
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

const ethAddress = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

const zeroBytes32 =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

const coder = new AbiCoder();

const ROOT_ID_HASH = keccak256(
  coder.encode(["uint256", "string"], [zeroBytes32, "ROOT"])
);

const ROOT_ID = BigNumber.from(ROOT_ID_HASH.toString()).toString();

function calcId(_domain: string): string {
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

function calcParentIdAndName(_domain: string): [string, string] {
  if (_domain === "ROOT") {
    return [ROOT_ID, "ROOT"];
  }
  let domains = _domain.split(".");
  const name = domains[domains.length - 1];
  domains = domains.slice(0, -1);
  let hash = ROOT_ID_HASH;
  for (const domain of domains) {
    hash = keccak256(coder.encode(["uint256", "string"], [hash, domain]));
  }
  return [BigNumber.from(hash).toString(), name];
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

interface BancorSwapData {
  path: string[];
  amount: BigNumberish;
  minOut: BigNumberish;
}

class ZeroSystem {
  registry: ZNSRegistry;
  staking: StakingController;
  constructor(
    signerOrProvider: Provider | Signer,
    registry: string,
    stakingController: string,
    public dynamicTokenController: string
  ) {
    this.registry = ZNSRegistry__factory.connect(registry, signerOrProvider);
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
    controllerData: DynamicControllerData,
    lockableProperties: string
  ) {
    return this.bid(
      signer,
      domain,
      proposal,
      amt,
      this.dynamicTokenController,
      this.encodeDynamicData(controllerData),
      lockableProperties
    );
  }

  async bid(
    signer: Signer,
    domain: string,
    proposal: string,
    amt: BigNumberish,
    controller: string,
    controllerData: BytesLike,
    lockableProperties: string
  ) {
    const [parentId, name] = calcParentIdAndName(domain);
    return this.staking
      .connect(signer)
      .bid(
        parentId,
        name,
        controller,
        { controllerData, lockableProperties },
        proposal,
        amt
      );
  }

  async bidWithDynamicControllerByPath(
    signer: Signer,
    domain: string,
    proposal: string,
    amt: BigNumberish,
    controllerData: DynamicControllerData,
    lockableProperties: string,
    swapData: BancorSwapData
  ) {
    return this.bidByPath(
      signer,
      domain,
      proposal,
      amt,
      this.dynamicTokenController,
      this.encodeDynamicData(controllerData),
      lockableProperties,
      swapData
    );
  }

  async bidByPath(
    signer: Signer,
    domain: string,
    proposal: string,
    amt: BigNumberish,
    controller: string,
    controllerData: BytesLike,
    lockableProperties: string,
    swapData: BancorSwapData
  ) {
    const overrides =
      swapData.path[0].toLowerCase() === ethAddress
        ? { value: swapData.amount }
        : {};
    const [parentId, name] = calcParentIdAndName(domain);
    return this.staking
      .connect(signer)
      .bidByPath(
        parentId,
        name,
        controller,
        { controllerData, lockableProperties },
        proposal,
        swapData,
        overrides
      );
  }

  async claimBidWithDynamicController(
    signer: Signer,
    domain: string,
    owner: string,
    controllerData: DynamicControllerData,
    lockableProperties: string
  ) {
    return this.claimBid(
      signer,
      domain,
      owner,
      this.dynamicTokenController,
      this.encodeDynamicData(controllerData),
      lockableProperties
    );
  }

  async claimBid(
    signer: Signer,
    domain: string,
    owner: string,
    controller: string,
    controllerData: BytesLike,
    lockableProperties: string
  ) {
    const [parentId, name] = calcParentIdAndName(domain);
    return this.staking
      .connect(signer)
      .claimBid(
        parentId,
        name,
        owner,
        controller,
        controllerData,
        lockableProperties
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
  calcId,
  calcParentIdAndName,
};
