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
  CallOverrides,
} from "@ethersproject/contracts";
import { BytesLike } from "@ethersproject/bytes";
import { Listener, Provider } from "@ethersproject/providers";
import { FunctionFragment, EventFragment, Result } from "@ethersproject/abi";

interface ConverterV28OrHigherWithFallbackInterface
  extends ethers.utils.Interface {
  functions: {
    "isV28OrHigher()": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "isV28OrHigher",
    values?: undefined
  ): string;

  decodeFunctionResult(
    functionFragment: "isV28OrHigher",
    data: BytesLike
  ): Result;

  events: {};
}

export class ConverterV28OrHigherWithFallback extends Contract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  on(event: EventFilter | string, listener: Listener): this;
  once(event: EventFilter | string, listener: Listener): this;
  addListener(eventName: EventFilter | string, listener: Listener): this;
  removeAllListeners(eventName: EventFilter | string): this;
  removeListener(eventName: any, listener: Listener): this;

  interface: ConverterV28OrHigherWithFallbackInterface;

  functions: {
    isV28OrHigher(overrides?: CallOverrides): Promise<[boolean]>;

    "isV28OrHigher()"(overrides?: CallOverrides): Promise<[boolean]>;
  };

  isV28OrHigher(overrides?: CallOverrides): Promise<boolean>;

  "isV28OrHigher()"(overrides?: CallOverrides): Promise<boolean>;

  callStatic: {
    isV28OrHigher(overrides?: CallOverrides): Promise<boolean>;

    "isV28OrHigher()"(overrides?: CallOverrides): Promise<boolean>;
  };

  filters: {};

  estimateGas: {
    isV28OrHigher(overrides?: CallOverrides): Promise<BigNumber>;

    "isV28OrHigher()"(overrides?: CallOverrides): Promise<BigNumber>;
  };

  populateTransaction: {
    isV28OrHigher(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "isV28OrHigher()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;
  };
}