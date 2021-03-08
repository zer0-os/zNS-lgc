/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, BigNumberish } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import { Contract, ContractFactory, Overrides } from "@ethersproject/contracts";

import type { TestStandardToken } from "../TestStandardToken";

export class TestStandardToken__factory extends ContractFactory {
  constructor(signer?: Signer) {
    super(_abi, _bytecode, signer);
  }

  deploy(
    _name: string,
    _symbol: string,
    _decimals: BigNumberish,
    _supply: BigNumberish,
    overrides?: Overrides
  ): Promise<TestStandardToken> {
    return super.deploy(
      _name,
      _symbol,
      _decimals,
      _supply,
      overrides || {}
    ) as Promise<TestStandardToken>;
  }
  getDeployTransaction(
    _name: string,
    _symbol: string,
    _decimals: BigNumberish,
    _supply: BigNumberish,
    overrides?: Overrides
  ): TransactionRequest {
    return super.getDeployTransaction(
      _name,
      _symbol,
      _decimals,
      _supply,
      overrides || {}
    );
  }
  attach(address: string): TestStandardToken {
    return super.attach(address) as TestStandardToken;
  }
  connect(signer: Signer): TestStandardToken__factory {
    return super.connect(signer) as TestStandardToken__factory;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): TestStandardToken {
    return new Contract(address, _abi, signerOrProvider) as TestStandardToken;
  }
}

const _abi = [
  {
    inputs: [
      {
        internalType: "string",
        name: "_name",
        type: "string",
      },
      {
        internalType: "string",
        name: "_symbol",
        type: "string",
      },
      {
        internalType: "uint8",
        name: "_decimals",
        type: "uint8",
      },
      {
        internalType: "uint256",
        name: "_supply",
        type: "uint256",
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
        name: "_owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "_spender",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "_value",
        type: "uint256",
      },
    ],
    name: "Approval",
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
        indexed: true,
        internalType: "address",
        name: "_to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "_value",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "allowance",
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
        internalType: "address",
        name: "_spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_value",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
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
    name: "balanceOf",
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
    name: "decimals",
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
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "ok",
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
    name: "ret",
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
        internalType: "bool",
        name: "_ok",
        type: "bool",
      },
      {
        internalType: "bool",
        name: "_ret",
        type: "bool",
      },
    ],
    name: "set",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
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
        internalType: "address",
        name: "_to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_value",
        type: "uint256",
      },
    ],
    name: "transfer",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_from",
        type: "address",
      },
      {
        internalType: "address",
        name: "_to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_value",
        type: "uint256",
      },
    ],
    name: "transferFrom",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const _bytecode =
  "0x608060405234801561001057600080fd5b50604051610ae1380380610ae18339818101604052608081101561003357600080fd5b810190808051604051939291908464010000000082111561005357600080fd5b90830190602082018581111561006857600080fd5b825164010000000081118282018810171561008257600080fd5b82525081516020918201929091019080838360005b838110156100af578181015183820152602001610097565b50505050905090810190601f1680156100dc5780820380516001836020036101000a031916815260200191505b50604052602001805160405193929190846401000000008211156100ff57600080fd5b90830190602082018581111561011457600080fd5b825164010000000081118282018810171561012e57600080fd5b82525081516020918201929091019080838360005b8381101561015b578181015183820152602001610143565b50505050905090810190601f1680156101885780820380516001836020036101000a031916815260200191505b5060409081526020828101519282015160008181553381526001835292909220829055865192945090925085918591859185916101ca91600391870190610237565b5082516101de906004906020860190610237565b50506005805460ff191660ff9290921691909117905550610202905060018061020b565b505050506102ca565b60058054911515620100000262ff0000199315156101000261ff00199093169290921792909216179055565b828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f1061027857805160ff19168380011785556102a5565b828001600101855582156102a5579182015b828111156102a557825182559160200191906001019061028a565b506102b19291506102b5565b5090565b5b808211156102b157600081556001016102b6565b610808806102d96000396000f3fe608060405234801561001057600080fd5b50600436106100b45760003560e01c806370a082311161007157806370a08231146101ec57806395d89b4114610212578063a9059cbb1461021a578063d909b40314610246578063dd62ed3e1461024e578063f907191a1461027c576100b4565b806306fdde03146100b9578063095ea7b31461013657806318160ddd146101765780631b08d96f1461019057806323b872dd14610198578063313ce567146101ce575b600080fd5b6100c16102a5565b6040805160208082528351818301528351919283929083019185019080838360005b838110156100fb5781810151838201526020016100e3565b50505050905090810190601f1680156101285780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b6101626004803603604081101561014c57600080fd5b506001600160a01b038135169060200135610333565b604080519115158252519081900360200190f35b61017e610366565b60408051918252519081900360200190f35b61016261036c565b610162600480360360608110156101ae57600080fd5b506001600160a01b0381358116916020810135909116906040013561037b565b6101d66103b0565b6040805160ff9092168252519081900360200190f35b61017e6004803603602081101561020257600080fd5b50356001600160a01b03166103b9565b6100c16103cb565b6101626004803603604081101561023057600080fd5b506001600160a01b038135169060200135610426565b610162610432565b61017e6004803603604081101561026457600080fd5b506001600160a01b0381358116916020013516610440565b6102a36004803603604081101561029257600080fd5b50803515159060200135151561045d565b005b6003805460408051602060026001851615610100026000190190941693909304601f8101849004840282018401909252818152929183018282801561032b5780601f106103005761010080835404028352916020019161032b565b820191906000526020600020905b81548152906001019060200180831161030e57829003601f168201915b505050505081565b600061033f8383610489565b600554610100900460ff1661035357600080fd5b505060055462010000900460ff16919050565b60005481565b60055462010000900460ff1681565b600061038884848461052d565b600554610100900460ff1661039c57600080fd5b505060055462010000900460ff1692915050565b60055460ff1681565b60016020526000908152604090205481565b6004805460408051602060026001851615610100026000190190941693909304601f8101849004840282018401909252818152929183018282801561032b5780601f106103005761010080835404028352916020019161032b565b600061033f8383610637565b600554610100900460ff1681565b600260209081526000928352604080842090915290825290205481565b60058054911515620100000262ff0000199315156101000261ff00199093169290921792909216179055565b81610493816106e1565b8115806104c157503360009081526002602090815260408083206001600160a01b0387168452909152902054155b6104ca57600080fd5b3360008181526002602090815260408083206001600160a01b03881680855290835292819020869055805186815290519293927f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925929181900390910190a3505050565b82610537816106e1565b82610541816106e1565b6001600160a01b038516600090815260026020908152604080832033845290915290205461056f9084610735565b6001600160a01b0386166000818152600260209081526040808320338452825280832094909455918152600190915220546105aa9084610735565b6001600160a01b0380871660009081526001602052604080822093909355908616815220546105d99084610782565b6001600160a01b0380861660008181526001602090815260409182902094909455805187815290519193928916927fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef92918290030190a35050505050565b81610641816106e1565b3360009081526001602052604090205461065b9083610735565b33600090815260016020526040808220929092556001600160a01b038516815220546106879083610782565b6001600160a01b0384166000818152600160209081526040918290209390935580518581529051919233927fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef9281900390910190a3505050565b6001600160a01b038116610732576040805162461bcd60e51b81526020600482015260136024820152724552525f494e56414c49445f4144445245535360681b604482015290519081900360640190fd5b50565b60008183101561077c576040805162461bcd60e51b815260206004820152600d60248201526c4552525f554e444552464c4f5760981b604482015290519081900360640190fd5b50900390565b6000828201838110156107cb576040805162461bcd60e51b815260206004820152600c60248201526b4552525f4f564552464c4f5760a01b604482015290519081900360640190fd5b939250505056fea2646970667358221220b1275eca68cf4bd3eb4deb68e06776621d2951f8b63db48889781d811fa99f1264736f6c634300060c0033";