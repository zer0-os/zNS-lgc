/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, BigNumberish } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import { Contract, ContractFactory, Overrides } from "@ethersproject/contracts";

import type { BancorX } from "../BancorX";

export class BancorX__factory extends ContractFactory {
  constructor(signer?: Signer) {
    super(_abi, _bytecode, signer);
  }

  deploy(
    _maxLockLimit: BigNumberish,
    _maxReleaseLimit: BigNumberish,
    _minLimit: BigNumberish,
    _limitIncPerBlock: BigNumberish,
    _minRequiredReports: BigNumberish,
    _registry: string,
    _token: string,
    overrides?: Overrides
  ): Promise<BancorX> {
    return super.deploy(
      _maxLockLimit,
      _maxReleaseLimit,
      _minLimit,
      _limitIncPerBlock,
      _minRequiredReports,
      _registry,
      _token,
      overrides || {}
    ) as Promise<BancorX>;
  }
  getDeployTransaction(
    _maxLockLimit: BigNumberish,
    _maxReleaseLimit: BigNumberish,
    _minLimit: BigNumberish,
    _limitIncPerBlock: BigNumberish,
    _minRequiredReports: BigNumberish,
    _registry: string,
    _token: string,
    overrides?: Overrides
  ): TransactionRequest {
    return super.getDeployTransaction(
      _maxLockLimit,
      _maxReleaseLimit,
      _minLimit,
      _limitIncPerBlock,
      _minRequiredReports,
      _registry,
      _token,
      overrides || {}
    );
  }
  attach(address: string): BancorX {
    return super.attach(address) as BancorX;
  }
  connect(signer: Signer): BancorX__factory {
    return super.connect(signer) as BancorX__factory;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): BancorX {
    return new Contract(address, _abi, signerOrProvider) as BancorX;
  }
}

const _abi = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_maxLockLimit",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_maxReleaseLimit",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_minLimit",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_limitIncPerBlock",
        type: "uint256",
      },
      {
        internalType: "uint8",
        name: "_minRequiredReports",
        type: "uint8",
      },
      {
        internalType: "contract IContractRegistry",
        name: "_registry",
        type: "address",
      },
      {
        internalType: "contract IERC20Token",
        name: "_token",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "_prevOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "_newOwner",
        type: "address",
      },
    ],
    name: "OwnerUpdate",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "_from",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "_amount",
        type: "uint256",
      },
    ],
    name: "TokensLock",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "_to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "_amount",
        type: "uint256",
      },
    ],
    name: "TokensRelease",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "_reporter",
        type: "address",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "_fromBlockchain",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "_txId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "_to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "_amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "_xTransferId",
        type: "uint256",
      },
    ],
    name: "TxReport",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "_from",
        type: "address",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "_toBlockchain",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "_to",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "_amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "_id",
        type: "uint256",
      },
    ],
    name: "XTransfer",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "_to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "_id",
        type: "uint256",
      },
    ],
    name: "XTransferComplete",
    type: "event",
  },
  {
    inputs: [],
    name: "acceptOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bool",
        name: "_enable",
        type: "bool",
      },
    ],
    name: "enableReporting",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bool",
        name: "_enable",
        type: "bool",
      },
    ],
    name: "enableXTransfers",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getCurrentLockLimit",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getCurrentReleaseLimit",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_xTransferId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "_for",
        type: "address",
      },
    ],
    name: "getXTransferAmount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "limitIncPerBlock",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "maxLockLimit",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "maxReleaseLimit",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "minLimit",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "minRequiredReports",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "newOwner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "onlyOwnerCanUpdateRegistry",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "prevLockBlockNumber",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "prevLockLimit",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "prevRegistry",
    outputs: [
      {
        internalType: "contract IContractRegistry",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "prevReleaseBlockNumber",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "prevReleaseLimit",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "registry",
    outputs: [
      {
        internalType: "contract IContractRegistry",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "_fromBlockchain",
        type: "bytes32",
      },
      {
        internalType: "uint256",
        name: "_txId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "_to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_amount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_xTransferId",
        type: "uint256",
      },
    ],
    name: "reportTx",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "reportedTxs",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "reporters",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "reportingEnabled",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "restoreRegistry",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bool",
        name: "_onlyOwnerCanUpdateRegistry",
        type: "bool",
      },
    ],
    name: "restrictRegistryUpdate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_limitIncPerBlock",
        type: "uint256",
      },
    ],
    name: "setLimitIncPerBlock",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_maxLockLimit",
        type: "uint256",
      },
    ],
    name: "setMaxLockLimit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_maxReleaseLimit",
        type: "uint256",
      },
    ],
    name: "setMaxReleaseLimit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_minLimit",
        type: "uint256",
      },
    ],
    name: "setMinLimit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint8",
        name: "_minRequiredReports",
        type: "uint8",
      },
    ],
    name: "setMinRequiredReports",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_reporter",
        type: "address",
      },
      {
        internalType: "bool",
        name: "_active",
        type: "bool",
      },
    ],
    name: "setReporter",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "token",
    outputs: [
      {
        internalType: "contract IERC20Token",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "transactionIds",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "transactions",
    outputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "bytes32",
        name: "fromBlockchain",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint8",
        name: "numOfReports",
        type: "uint8",
      },
      {
        internalType: "bool",
        name: "completed",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_newOwner",
        type: "address",
      },
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "updateRegistry",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address[]",
        name: "_reporters",
        type: "address[]",
      },
    ],
    name: "upgrade",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "version",
    outputs: [
      {
        internalType: "uint16",
        name: "",
        type: "uint16",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IERC20Token",
        name: "_token",
        type: "address",
      },
      {
        internalType: "address",
        name: "_to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_amount",
        type: "uint256",
      },
    ],
    name: "withdrawTokens",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "_toBlockchain",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "_to",
        type: "bytes32",
      },
      {
        internalType: "uint256",
        name: "_amount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_id",
        type: "uint256",
      },
    ],
    name: "xTransfer",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "_toBlockchain",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "_to",
        type: "bytes32",
      },
      {
        internalType: "uint256",
        name: "_amount",
        type: "uint256",
      },
    ],
    name: "xTransfer",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "xTransfersEnabled",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

const _bytecode =
  "0x6080604052600c805460ff60b01b1960ff60a81b19909116600160a81b1716600160b01b1790553480156200003357600080fd5b506040516200205938038062002059833981810160405260e08110156200005957600080fd5b508051602082015160408301516060840151608085015160a086015160c090960151600080546001600160a01b0319163317905594959394929391929091908180620000a581620001f6565b50600280546001600160a01b039092166001600160a01b031992831681179091556003805490921617905586620000dc8162000255565b86620000e88162000255565b86620000f48162000255565b86620001008162000255565b60ff87166200010f8162000255565b856200011b81620001f6565b8662000127816200029c565b8d8c111580156200013857508c8c11155b6200018a576040805162461bcd60e51b815260206004820152601560248201527f4552525f494e56414c49445f4d494e5f4c494d49540000000000000000000000604482015290519081900360640190fd5b50505060048b905550505060058790555060069490945550600991909155600c805460079590955560089390935543600a819055600b556001600160a01b0390911661010002610100600160a81b031960ff90921660ff199094169390931716919091179055620002fb565b6001600160a01b03811662000252576040805162461bcd60e51b815260206004820152601360248201527f4552525f494e56414c49445f4144445245535300000000000000000000000000604482015290519081900360640190fd5b50565b6000811162000252576040805162461bcd60e51b815260206004820152600e60248201526d4552525f5a45524f5f56414c554560901b604482015290519081900360640190fd5b6001600160a01b03811630141562000252576040805162461bcd60e51b815260206004820152601360248201527f4552525f414444524553535f49535f53454c4600000000000000000000000000604482015290519081900360640190fd5b611d4e806200030b6000396000f3fe608060405234801561001057600080fd5b50600436106102695760003560e01c80637b10399911610151578063b4a176d3116100c3578063e36f8dc511610087578063e36f8dc5146106c1578063ed1d73a6146106de578063f2fde38b146106fd578063f7385f7614610723578063fbb246921461072b578063fc0c546a1461073357610269565b8063b4a176d314610648578063bf28ece414610650578063ca27e0111461066d578063d4ee1d901461068b578063e1bb51331461069357610269565b80639ace38c2116101155780639ace38c214610566578063a50c326c146105bb578063a5c670ca146105d8578063a8c36a90146105f7578063aafd6b76146105ff578063af2b96181461062b57610269565b80637b103999146105025780637b15879c1461050a5780638544c52d1461052a5780638da5cb5b146105565780639390701c1461055e57610269565b806349282538116101ea5780635e35359e116101ae5780635e35359e1461043d57806361cd756e146104735780636dc6a01b146104975780636ec6d4a6146104d557806372f43d19146104f257806379ba5097146104fa57610269565b806349282538146103dd57806349d10b64146104065780634b3e475c1461040e57806352e94ce31461041657806354fd4d501461041e57610269565b80631e04a593116102315780631e04a5931461035c5780631fd8088d146103645780632cc1cd9e1461036c5780632fe8a6ad146103a6578063427c0374146103ae57610269565b80630183592b1461026e578063024c7ec71461031357806316c76c2714610332578063199674391461034c5780631aff29eb14610354575b600080fd5b6103116004803603602081101561028457600080fd5b81019060208101813564010000000081111561029f57600080fd5b8201836020820111156102b157600080fd5b803590602001918460208302840111640100000000831117156102d357600080fd5b91908080602002602001604051908101604052809392919081815260200183836020028082843760009201919091525092955061073b945050505050565b005b6103116004803603602081101561032957600080fd5b5035151561081a565b61033a610840565b60408051918252519081900360200190f35b61033a610846565b61033a610892565b61033a610898565b61033a6108d8565b6103926004803603602081101561038257600080fd5b50356001600160a01b03166108de565b604080519115158252519081900360200190f35b6103926108f3565b610311600480360360808110156103c457600080fd5b5080359060208101359060408101359060600135610903565b610311600480360360608110156103f357600080fd5b50803590602081013590604001356109d5565b610311610aa6565b61033a610cae565b61033a610cb4565b610426610cba565b6040805161ffff9092168252519081900360200190f35b6103116004803603606081101561045357600080fd5b506001600160a01b03813581169160208101359091169060400135610cbf565b61047b610cf8565b604080516001600160a01b039092168252519081900360200190f35b610311600480360360a08110156104ad57600080fd5b508035906020810135906001600160a01b036040820135169060608101359060800135610d07565b610311600480360360208110156104eb57600080fd5b50356110c5565b61033a61113a565b610311611140565b61047b6111f7565b6103116004803603602081101561052057600080fd5b503560ff16611206565b6103926004803603604081101561054057600080fd5b50803590602001356001600160a01b0316611232565b61047b611252565b610392611261565b6105836004803603602081101561057c57600080fd5b5035611271565b6040805195865260208601949094526001600160a01b039092168484015260ff16606084015215156080830152519081900360a00190f35b610311600480360360208110156105d157600080fd5b50356112b1565b610311600480360360208110156105ee57600080fd5b503515156112c9565b61033a6112ef565b61033a6004803603604081101561061557600080fd5b50803590602001356001600160a01b03166112f5565b6103116004803603602081101561064157600080fd5b50356113be565b6103116113d6565b6103116004803603602081101561066657600080fd5b5035611402565b61067561141a565b6040805160ff9092168252519081900360200190f35b61047b611423565b610311600480360360408110156106a957600080fd5b506001600160a01b0381351690602001351515611432565b61033a600480360360208110156106d757600080fd5b5035611465565b610311600480360360208110156106f457600080fd5b50351515611477565b6103116004803603602081101561071357600080fd5b50356001600160a01b031661149d565b61033a61151b565b610392611521565b61047b611531565b610743611545565b60006107606e2130b731b7b92c2ab833b930b232b960891b61159a565b905061076b8161149d565b6040805163151a1cb360e21b81526004818101818152602483019384528551604484015285516001600160a01b0386169463546872cc948893926064909101906020808601910280838360005b838110156107d05781810151838201526020016107b8565b505050509050019350505050600060405180830381600087803b1580156107f657600080fd5b505af115801561080a573d6000803e3d6000fd5b50505050610816611140565b5050565b610822611545565b60038054911515600160a01b0260ff60a01b19909216919091179055565b60075481565b60008061087661086d600954610867600a544361161890919063ffffffff16565b90611665565b600754906116ca565b905060045481111561088c57505060045461088f565b90505b90565b600a5481565b6000806108c26108b9600954610867600b544361161890919063ffffffff16565b600854906116ca565b905060055481111561088c57505060055461088f565b60065481565b60106020526000908152604090205460ff1681565b600354600160a01b900460ff1681565b61090b611713565b6000610915610846565b905060065483101580156109295750808311155b610970576040805162461bcd60e51b815260206004820152601360248201527208aa4a4be829a9eaa9ca8bea89e9ebe90928e9606b1b604482015290519081900360640190fd5b61097983611760565b6109838184611618565b60075543600a5560408051868152602081018590528082018490529051859133917f4780f3edc9124597ede658e04ed3d8887b58c86943b2a805dc961cf512570b629181900360600190a35050505050565b6109dd611713565b60006109e7610846565b905060065482101580156109fb5750808211155b610a42576040805162461bcd60e51b815260206004820152601360248201527208aa4a4be829a9eaa9ca8bea89e9ebe90928e9606b1b604482015290519081900360640190fd5b610a4b82611760565b610a558183611618565b60075543600a5560408051858152602081018490526000818301529051849133917f4780f3edc9124597ede658e04ed3d8887b58c86943b2a805dc961cf512570b629181900360600190a350505050565b6000546001600160a01b0316331480610ac95750600354600160a01b900460ff16155b610b0e576040805162461bcd60e51b815260206004820152601160248201527011549497d050d0d154d4d7d11153925151607a1b604482015290519081900360640190fd5b6000610b2c6f436f6e7472616374526567697374727960801b61159a565b6002549091506001600160a01b03808316911614801590610b5557506001600160a01b03811615155b610b9d576040805162461bcd60e51b81526020600482015260146024820152734552525f494e56414c49445f524547495354525960601b604482015290519081900360640190fd5b60006001600160a01b0316816001600160a01b031663bb34534c6f436f6e7472616374526567697374727960801b6040518263ffffffff1660e01b81526004018082815260200191505060206040518083038186803b158015610bff57600080fd5b505afa158015610c13573d6000803e3d6000fd5b505050506040513d6020811015610c2957600080fd5b50516001600160a01b03161415610c7e576040805162461bcd60e51b81526020600482015260146024820152734552525f494e56414c49445f524547495354525960601b604482015290519081900360640190fd5b60028054600380546001600160a01b038084166001600160a01b0319928316179092559091169216919091179055565b600b5481565b60055481565b600481565b610cc7611545565b82610cd1816117b6565b82610cdb816117b6565b83610ce58161180a565b610cf086868661185e565b505050505050565b6003546001600160a01b031681565b610d0f6119be565b610d17611a16565b82610d21816117b6565b82610d2b81611a63565b6000868152600f6020908152604080832033845290915290205460ff1615610d91576040805162461bcd60e51b815260206004820152601460248201527311549497d053149150511657d4915413d495115160621b604482015290519081900360640190fd5b6000868152600f602090815260408083203384528252808320805460ff19166001179055888352600d90915290206002810154600160a01b900460ff16610e6f576002810180546001600160a01b0319166001600160a01b038816179055848155600181018890558315610e6a576000848152600e602052604090205415610e58576040805162461bcd60e51b81526020600482015260156024820152744552525f54585f414c52454144595f45584953545360581b604482015290519081900360640190fd5b6000848152600e602052604090208790555b610f40565b60028101546001600160a01b038781169116148015610e8e5750805485145b8015610e9d5750878160010154145b610ee0576040805162461bcd60e51b815260206004820152600f60248201526e08aa4a4bea8b0be9a92a69a82a8869608b1b604482015290519081900360640190fd5b8315610f40576000848152600e60205260409020548714610f40576040805162461bcd60e51b81526020600482015260156024820152744552525f54585f414c52454144595f45584953545360581b604482015290519081900360640190fd5b600281018054600160ff600160a01b808404821692909201160260ff60a01b1990911617905560408051898152602081018990526001600160a01b038816818301526060810187905260808101869052905133917f5e77831e701760f7f4a1e61a8e9834d773b52c45d91ba9006b7d2afb7a144739919081900360a00190a2600c54600282015460ff918216600160a01b909104909116106110bb576000878152600d6020526040902060020154600160a81b900460ff161561104a576040805162461bcd60e51b815260206004820152601860248201527f4552525f54585f414c52454144595f434f4d504c455445440000000000000000604482015290519081900360640190fd5b6000878152600d6020908152604091829020600201805460ff60a81b1916600160a81b17905581516001600160a01b038916815290810186905281517fd87906b7fce534fc5e6dde30064e777d92d0aaf3a28c72315de8ef2e4134dfef929181900390910190a16110bb8686611aa9565b5050505050505050565b6110cd611545565b806110d781611a63565b60045482111580156110eb57506005548211155b611134576040805162461bcd60e51b815260206004820152601560248201527411549497d253959053125117d3525397d312535255605a1b604482015290519081900360640190fd5b50600655565b60095481565b6001546001600160a01b03163314611193576040805162461bcd60e51b815260206004820152601160248201527011549497d050d0d154d4d7d11153925151607a1b604482015290519081900360640190fd5b600154600080546040516001600160a01b0393841693909116917f343765429aea5a34b3ff6a3785a98a5abb2597aca87bfbb58632c173d585373a91a360018054600080546001600160a01b03199081166001600160a01b03841617909155169055565b6002546001600160a01b031681565b61120e611545565b8060ff1661121b81611a63565b50600c805460ff191660ff92909216919091179055565b600f60209081526000928352604080842090915290825290205460ff1681565b6000546001600160a01b031681565b600c54600160b01b900460ff1681565b600d602052600090815260409020805460018201546002909201549091906001600160a01b0381169060ff600160a01b8204811691600160a81b90041685565b6112b9611545565b806112c381611a63565b50600955565b6112d1611545565b600c8054911515600160a81b0260ff60a81b19909216919091179055565b60045481565b60006112ff611cea565b506000838152600e60209081526040808320548352600d825291829020825160a08101845281548152600182015492810192909252600201546001600160a01b0380821693830184905260ff600160a01b830481166060850152600160a81b909204909116151560808301529091908416146113b4576040805162461bcd60e51b815260206004820152600f60248201526e08aa4a4bea8b0be9a92a69a82a8869608b1b604482015290519081900360640190fd5b5190505b92915050565b6113c6611545565b806113d081611a63565b50600455565b6113de611545565b600354600280546001600160a01b0319166001600160a01b03909216919091179055565b61140a611545565b8061141481611a63565b50600555565b600c5460ff1681565b6001546001600160a01b031681565b61143a611545565b6001600160a01b03919091166000908152601060205260409020805460ff1916911515919091179055565b600e6020526000908152604090205481565b61147f611545565b600c8054911515600160b01b0260ff60b01b19909216919091179055565b6114a5611545565b6000546001600160a01b03828116911614156114f9576040805162461bcd60e51b815260206004820152600e60248201526d22a9292fa9a0a6a2afa7aba722a960911b604482015290519081900360640190fd5b600180546001600160a01b0319166001600160a01b0392909216919091179055565b60085481565b600c54600160a81b900460ff1681565b600c5461010090046001600160a01b031681565b6000546001600160a01b03163314611598576040805162461bcd60e51b815260206004820152601160248201527011549497d050d0d154d4d7d11153925151607a1b604482015290519081900360640190fd5b565b60025460408051632ecd14d360e21b81526004810184905290516000926001600160a01b03169163bb34534c916024808301926020929190829003018186803b1580156115e657600080fd5b505afa1580156115fa573d6000803e3d6000fd5b505050506040513d602081101561161057600080fd5b505192915050565b60008183101561165f576040805162461bcd60e51b815260206004820152600d60248201526c4552525f554e444552464c4f5760981b604482015290519081900360640190fd5b50900390565b600082611674575060006113b8565b8282028284828161168157fe5b04146116c3576040805162461bcd60e51b815260206004820152600c60248201526b4552525f4f564552464c4f5760a01b604482015290519081900360640190fd5b9392505050565b6000828201838110156116c3576040805162461bcd60e51b815260206004820152600c60248201526b4552525f4f564552464c4f5760a01b604482015290519081900360640190fd5b600c54600160a81b900460ff16611598576040805162461bcd60e51b815260206004820152600c60248201526b11549497d11254d05093115160a21b604482015290519081900360640190fd5b600c5461177d9061010090046001600160a01b0316333084611b7f565b60408051828152905133917ff5d7535a395393675f56d066384113754ca9cf4abd37298469934e2e9c2ec902919081900360200190a250565b6001600160a01b038116611807576040805162461bcd60e51b81526020600482015260136024820152724552525f494e56414c49445f4144445245535360681b604482015290519081900360640190fd5b50565b6001600160a01b038116301415611807576040805162461bcd60e51b815260206004820152601360248201527222a9292fa0a2222922a9a9afa4a9afa9a2a62360691b604482015290519081900360640190fd5b604080516001600160a01b038481166024830152604480830185905283518084039091018152606490920183526020820180516001600160e01b031663a9059cbb60e01b178152925182516000946060949389169392918291908083835b602083106118db5780518252601f1990920191602091820191016118bc565b6001836020036101000a0380198251168184511680821785525050505050509050019150506000604051808303816000865af19150503d806000811461193d576040519150601f19603f3d011682016040523d82523d6000602084013e611942565b606091505b5091509150818015611970575080511580611970575080806020019051602081101561196d57600080fd5b50515b6119b7576040805162461bcd60e51b815260206004820152601360248201527211549497d514905394d1915497d19052531151606a1b604482015290519081900360640190fd5b5050505050565b3360009081526010602052604090205460ff16611598576040805162461bcd60e51b815260206004820152601160248201527011549497d050d0d154d4d7d11153925151607a1b604482015290519081900360640190fd5b600c54600160b01b900460ff16611598576040805162461bcd60e51b815260206004820152600c60248201526b11549497d11254d05093115160a21b604482015290519081900360640190fd5b60008111611807576040805162461bcd60e51b815260206004820152600e60248201526d4552525f5a45524f5f56414c554560901b604482015290519081900360640190fd5b6000611ab3610898565b90506006548210158015611ac75750808211155b611b0e576040805162461bcd60e51b815260206004820152601360248201527208aa4a4be829a9eaa9ca8bea89e9ebe90928e9606b1b604482015290519081900360640190fd5b611b188183611618565b60085543600b55600c54611b3b9061010090046001600160a01b0316848461185e565b6040805183815290516001600160a01b038516917fbfdc1f3c02b4715077e0be4a262f967d53d4d0fcd76c6987fa2ad6e2257d7c8f919081900360200190a2505050565b604080516001600160a01b0385811660248301528481166044830152606480830185905283518084039091018152608490920183526020820180516001600160e01b03166323b872dd60e01b17815292518251600094606094938a169392918291908083835b60208310611c045780518252601f199092019160209182019101611be5565b6001836020036101000a0380198251168184511680821785525050505050509050019150506000604051808303816000865af19150503d8060008114611c66576040519150601f19603f3d011682016040523d82523d6000602084013e611c6b565b606091505b5091509150818015611c99575080511580611c995750808060200190516020811015611c9657600080fd5b50515b610cf0576040805162461bcd60e51b815260206004820152601860248201527f4552525f5452414e534645525f46524f4d5f4641494c45440000000000000000604482015290519081900360640190fd5b6040805160a0810182526000808252602082018190529181018290526060810182905260808101919091529056fea2646970667358221220e20351239521cd3daf3ec17d9f4be9c80324037b913a1ccba700ae3f3154726364736f6c634300060c0033";