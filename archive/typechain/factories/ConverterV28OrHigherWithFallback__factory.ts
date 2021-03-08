/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import { Contract, ContractFactory, Overrides } from "@ethersproject/contracts";

import type { ConverterV28OrHigherWithFallback } from "../ConverterV28OrHigherWithFallback";

export class ConverterV28OrHigherWithFallback__factory extends ContractFactory {
  constructor(signer?: Signer) {
    super(_abi, _bytecode, signer);
  }

  deploy(overrides?: Overrides): Promise<ConverterV28OrHigherWithFallback> {
    return super.deploy(
      overrides || {}
    ) as Promise<ConverterV28OrHigherWithFallback>;
  }
  getDeployTransaction(overrides?: Overrides): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): ConverterV28OrHigherWithFallback {
    return super.attach(address) as ConverterV28OrHigherWithFallback;
  }
  connect(signer: Signer): ConverterV28OrHigherWithFallback__factory {
    return super.connect(signer) as ConverterV28OrHigherWithFallback__factory;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): ConverterV28OrHigherWithFallback {
    return new Contract(
      address,
      _abi,
      signerOrProvider
    ) as ConverterV28OrHigherWithFallback;
  }
}

const _abi = [
  {
    inputs: [],
    name: "isV28OrHigher",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    stateMutability: "payable",
    type: "receive",
  },
];

const _bytecode =
  "0x6080604052348015600f57600080fd5b50608e8061001e6000396000f3fe608060405260043610601f5760003560e01c8063d260529c14602d576028565b36602857600080fd5b600080fd5b348015603857600080fd5b50603f6053565b604080519115158252519081900360200190f35b60019056fea264697066735822122089de6f99d3cd8dc4b71c91811d75715587cfd5263d2acddb7111d17c0787178464736f6c634300060c0033";