/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import { Contract, ContractFactory, Overrides } from "@ethersproject/contracts";

import type { TestReentrancyGuard } from "../TestReentrancyGuard";

export class TestReentrancyGuard__factory extends ContractFactory {
  constructor(signer?: Signer) {
    super(_abi, _bytecode, signer);
  }

  deploy(overrides?: Overrides): Promise<TestReentrancyGuard> {
    return super.deploy(overrides || {}) as Promise<TestReentrancyGuard>;
  }
  getDeployTransaction(overrides?: Overrides): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): TestReentrancyGuard {
    return super.attach(address) as TestReentrancyGuard;
  }
  connect(signer: Signer): TestReentrancyGuard__factory {
    return super.connect(signer) as TestReentrancyGuard__factory;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): TestReentrancyGuard {
    return new Contract(address, _abi, signerOrProvider) as TestReentrancyGuard;
  }
}

const _abi = [
  {
    inputs: [],
    name: "calls",
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
    name: "protectedMethod",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "unprotectedMethod",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const _bytecode =
  "0x60806040526000805460ff1916905534801561001a57600080fd5b506101c68061002a6000396000f3fe608060405234801561001057600080fd5b50600436106100415760003560e01c80632d4d800c14610046578063305f72b714610050578063f86485d91461006a575b600080fd5b61004e610072565b005b61005861009b565b60408051918252519081900360200190f35b61004e6100a1565b61007a6100ab565b6000805460ff1916600117905561008f61011d565b6000805460ff19169055565b60015481565b6100a961011d565b565b60005460ff16156100a957604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152600e60248201527f4552525f5245454e5452414e4359000000000000000000000000000000000000604482015290519081900360640190fd5b6001805481019055604080517f083b27320000000000000000000000000000000000000000000000000000000081529051339163083b273291600480830192600092919082900301818387803b15801561017657600080fd5b505af115801561018a573d6000803e3d6000fd5b5050505056fea2646970667358221220d618889fea696eddbfced216e950c4309a64a49c0e3104576c6f82c052fa7ca764736f6c634300060c0033";