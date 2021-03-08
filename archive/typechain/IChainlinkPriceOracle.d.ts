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

interface IChainlinkPriceOracleInterface extends ethers.utils.Interface {
  functions: {
    "latestAnswer()": FunctionFragment;
    "latestTimestamp()": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "latestAnswer",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "latestTimestamp",
    values?: undefined
  ): string;

  decodeFunctionResult(
    functionFragment: "latestAnswer",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "latestTimestamp",
    data: BytesLike
  ): Result;

  events: {};
}

export class IChainlinkPriceOracle extends Contract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  on(event: EventFilter | string, listener: Listener): this;
  once(event: EventFilter | string, listener: Listener): this;
  addListener(eventName: EventFilter | string, listener: Listener): this;
  removeAllListeners(eventName: EventFilter | string): this;
  removeListener(eventName: any, listener: Listener): this;

  interface: IChainlinkPriceOracleInterface;

  functions: {
    latestAnswer(overrides?: CallOverrides): Promise<[BigNumber]>;

    "latestAnswer()"(overrides?: CallOverrides): Promise<[BigNumber]>;

    latestTimestamp(overrides?: CallOverrides): Promise<[BigNumber]>;

    "latestTimestamp()"(overrides?: CallOverrides): Promise<[BigNumber]>;
  };

  latestAnswer(overrides?: CallOverrides): Promise<BigNumber>;

  "latestAnswer()"(overrides?: CallOverrides): Promise<BigNumber>;

  latestTimestamp(overrides?: CallOverrides): Promise<BigNumber>;

  "latestTimestamp()"(overrides?: CallOverrides): Promise<BigNumber>;

  callStatic: {
    latestAnswer(overrides?: CallOverrides): Promise<BigNumber>;

    "latestAnswer()"(overrides?: CallOverrides): Promise<BigNumber>;

    latestTimestamp(overrides?: CallOverrides): Promise<BigNumber>;

    "latestTimestamp()"(overrides?: CallOverrides): Promise<BigNumber>;
  };

  filters: {};

  estimateGas: {
    latestAnswer(overrides?: CallOverrides): Promise<BigNumber>;

    "latestAnswer()"(overrides?: CallOverrides): Promise<BigNumber>;

    latestTimestamp(overrides?: CallOverrides): Promise<BigNumber>;

    "latestTimestamp()"(overrides?: CallOverrides): Promise<BigNumber>;
  };

  populateTransaction: {
    latestAnswer(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "latestAnswer()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    latestTimestamp(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "latestTimestamp()"(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;
  };
}