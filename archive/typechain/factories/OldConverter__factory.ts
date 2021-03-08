/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, BigNumberish } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import { Contract, ContractFactory, Overrides } from "@ethersproject/contracts";

import type { OldConverter } from "../OldConverter";

export class OldConverter__factory extends ContractFactory {
  constructor(signer?: Signer) {
    super(_abi, _bytecode, signer);
  }

  deploy(_amount: BigNumberish, overrides?: Overrides): Promise<OldConverter> {
    return super.deploy(_amount, overrides || {}) as Promise<OldConverter>;
  }
  getDeployTransaction(
    _amount: BigNumberish,
    overrides?: Overrides
  ): TransactionRequest {
    return super.getDeployTransaction(_amount, overrides || {});
  }
  attach(address: string): OldConverter {
    return super.attach(address) as OldConverter;
  }
  connect(signer: Signer): OldConverter__factory {
    return super.connect(signer) as OldConverter__factory;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): OldConverter {
    return new Contract(address, _abi, signerOrProvider) as OldConverter;
  }
}

const _abi = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_amount",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      {
        internalType: "contract IERC20Token",
        name: "_sourceToken",
        type: "address",
      },
      {
        internalType: "contract IERC20Token",
        name: "_targetToken",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_amount",
        type: "uint256",
      },
    ],
    name: "getReturn",
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
];

const _bytecode =
  "0x608060405234801561001057600080fd5b506040516100f83803806100f88339818101604052602081101561003357600080fd5b505160005560b2806100466000396000f3fe6080604052348015600f57600080fd5b506004361060285760003560e01c80631e1401f814602d575b600080fd5b606060048036036060811015604157600080fd5b506001600160a01b038135811691602081013590911690604001356072565b60408051918252519081900360200190f35b600054939250505056fea26469706673582212207273f670a6e19ca8df530cd3a4b67fd147fd7a3219554a5fcbdfb13f0cad282064736f6c634300060c0033";