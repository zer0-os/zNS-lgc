/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import {
  ethers,
  EventFilter,
  Signer,
  BigNumber,
  BigNumberish,
  PopulatedTransaction,
} from "ethers";
import {
  Contract,
  ContractTransaction,
  PayableOverrides,
  CallOverrides,
} from "@ethersproject/contracts";
import { BytesLike } from "@ethersproject/bytes";
import { Listener, Provider } from "@ethersproject/providers";
import { FunctionFragment, EventFragment, Result } from "@ethersproject/abi";

interface IBancorNetworkInterface extends ethers.utils.Interface {
  functions: {
    "convertByPath(address[],uint256,uint256,address,address,uint256)": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "convertByPath",
    values: [string[], BigNumberish, BigNumberish, string, string, BigNumberish]
  ): string;

  decodeFunctionResult(
    functionFragment: "convertByPath",
    data: BytesLike
  ): Result;

  events: {};
}

export class IBancorNetwork extends Contract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  on(event: EventFilter | string, listener: Listener): this;
  once(event: EventFilter | string, listener: Listener): this;
  addListener(eventName: EventFilter | string, listener: Listener): this;
  removeAllListeners(eventName: EventFilter | string): this;
  removeListener(eventName: any, listener: Listener): this;

  interface: IBancorNetworkInterface;

  functions: {
    convertByPath(
      _path: string[],
      _amount: BigNumberish,
      _minReturn: BigNumberish,
      _beneficiary: string,
      _affiliateAccount: string,
      _affiliateFee: BigNumberish,
      overrides?: PayableOverrides
    ): Promise<ContractTransaction>;

    "convertByPath(address[],uint256,uint256,address,address,uint256)"(
      _path: string[],
      _amount: BigNumberish,
      _minReturn: BigNumberish,
      _beneficiary: string,
      _affiliateAccount: string,
      _affiliateFee: BigNumberish,
      overrides?: PayableOverrides
    ): Promise<ContractTransaction>;
  };

  convertByPath(
    _path: string[],
    _amount: BigNumberish,
    _minReturn: BigNumberish,
    _beneficiary: string,
    _affiliateAccount: string,
    _affiliateFee: BigNumberish,
    overrides?: PayableOverrides
  ): Promise<ContractTransaction>;

  "convertByPath(address[],uint256,uint256,address,address,uint256)"(
    _path: string[],
    _amount: BigNumberish,
    _minReturn: BigNumberish,
    _beneficiary: string,
    _affiliateAccount: string,
    _affiliateFee: BigNumberish,
    overrides?: PayableOverrides
  ): Promise<ContractTransaction>;

  callStatic: {
    convertByPath(
      _path: string[],
      _amount: BigNumberish,
      _minReturn: BigNumberish,
      _beneficiary: string,
      _affiliateAccount: string,
      _affiliateFee: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "convertByPath(address[],uint256,uint256,address,address,uint256)"(
      _path: string[],
      _amount: BigNumberish,
      _minReturn: BigNumberish,
      _beneficiary: string,
      _affiliateAccount: string,
      _affiliateFee: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;
  };

  filters: {};

  estimateGas: {
    convertByPath(
      _path: string[],
      _amount: BigNumberish,
      _minReturn: BigNumberish,
      _beneficiary: string,
      _affiliateAccount: string,
      _affiliateFee: BigNumberish,
      overrides?: PayableOverrides
    ): Promise<BigNumber>;

    "convertByPath(address[],uint256,uint256,address,address,uint256)"(
      _path: string[],
      _amount: BigNumberish,
      _minReturn: BigNumberish,
      _beneficiary: string,
      _affiliateAccount: string,
      _affiliateFee: BigNumberish,
      overrides?: PayableOverrides
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    convertByPath(
      _path: string[],
      _amount: BigNumberish,
      _minReturn: BigNumberish,
      _beneficiary: string,
      _affiliateAccount: string,
      _affiliateFee: BigNumberish,
      overrides?: PayableOverrides
    ): Promise<PopulatedTransaction>;

    "convertByPath(address[],uint256,uint256,address,address,uint256)"(
      _path: string[],
      _amount: BigNumberish,
      _minReturn: BigNumberish,
      _beneficiary: string,
      _affiliateAccount: string,
      _affiliateFee: BigNumberish,
      overrides?: PayableOverrides
    ): Promise<PopulatedTransaction>;
  };
}