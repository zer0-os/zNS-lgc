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
  Overrides,
  CallOverrides,
} from "@ethersproject/contracts";
import { BytesLike } from "@ethersproject/bytes";
import { Listener, Provider } from "@ethersproject/providers";
import { FunctionFragment, EventFragment, Result } from "@ethersproject/abi";

interface ConverterFactoryInterface extends ethers.utils.Interface {
  functions: {
    "acceptOwnership()": FunctionFragment;
    "anchorFactories(uint16)": FunctionFragment;
    "converterFactories(uint16)": FunctionFragment;
    "createAnchor(uint16,string,string,uint8)": FunctionFragment;
    "createConverter(uint16,address,address,uint32)": FunctionFragment;
    "customFactories(uint16)": FunctionFragment;
    "newOwner()": FunctionFragment;
    "owner()": FunctionFragment;
    "registerTypedConverterAnchorFactory(address)": FunctionFragment;
    "registerTypedConverterCustomFactory(address)": FunctionFragment;
    "registerTypedConverterFactory(address)": FunctionFragment;
    "transferOwnership(address)": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "acceptOwnership",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "anchorFactories",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "converterFactories",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "createAnchor",
    values: [BigNumberish, string, string, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "createConverter",
    values: [BigNumberish, string, string, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "customFactories",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(functionFragment: "newOwner", values?: undefined): string;
  encodeFunctionData(functionFragment: "owner", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "registerTypedConverterAnchorFactory",
    values: [string]
  ): string;
  encodeFunctionData(
    functionFragment: "registerTypedConverterCustomFactory",
    values: [string]
  ): string;
  encodeFunctionData(
    functionFragment: "registerTypedConverterFactory",
    values: [string]
  ): string;
  encodeFunctionData(
    functionFragment: "transferOwnership",
    values: [string]
  ): string;

  decodeFunctionResult(
    functionFragment: "acceptOwnership",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "anchorFactories",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "converterFactories",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "createAnchor",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "createConverter",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "customFactories",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "newOwner", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "owner", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "registerTypedConverterAnchorFactory",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "registerTypedConverterCustomFactory",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "registerTypedConverterFactory",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "transferOwnership",
    data: BytesLike
  ): Result;

  events: {
    "NewConverter(uint16,address,address)": EventFragment;
    "OwnerUpdate(address,address)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "NewConverter"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "OwnerUpdate"): EventFragment;
}

export class ConverterFactory extends Contract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  on(event: EventFilter | string, listener: Listener): this;
  once(event: EventFilter | string, listener: Listener): this;
  addListener(eventName: EventFilter | string, listener: Listener): this;
  removeAllListeners(eventName: EventFilter | string): this;
  removeListener(eventName: any, listener: Listener): this;

  interface: ConverterFactoryInterface;

  functions: {
    acceptOwnership(overrides?: Overrides): Promise<ContractTransaction>;

    "acceptOwnership()"(overrides?: Overrides): Promise<ContractTransaction>;

    anchorFactories(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[string]>;

    "anchorFactories(uint16)"(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[string]>;

    converterFactories(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[string]>;

    "converterFactories(uint16)"(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[string]>;

    createAnchor(
      _converterType: BigNumberish,
      _name: string,
      _symbol: string,
      _decimals: BigNumberish,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "createAnchor(uint16,string,string,uint8)"(
      _converterType: BigNumberish,
      _name: string,
      _symbol: string,
      _decimals: BigNumberish,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    createConverter(
      _type: BigNumberish,
      _anchor: string,
      _registry: string,
      _maxConversionFee: BigNumberish,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "createConverter(uint16,address,address,uint32)"(
      _type: BigNumberish,
      _anchor: string,
      _registry: string,
      _maxConversionFee: BigNumberish,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    customFactories(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[string]>;

    "customFactories(uint16)"(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[string]>;

    newOwner(overrides?: CallOverrides): Promise<[string]>;

    "newOwner()"(overrides?: CallOverrides): Promise<[string]>;

    owner(overrides?: CallOverrides): Promise<[string]>;

    "owner()"(overrides?: CallOverrides): Promise<[string]>;

    registerTypedConverterAnchorFactory(
      _factory: string,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "registerTypedConverterAnchorFactory(address)"(
      _factory: string,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    registerTypedConverterCustomFactory(
      _factory: string,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "registerTypedConverterCustomFactory(address)"(
      _factory: string,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    registerTypedConverterFactory(
      _factory: string,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "registerTypedConverterFactory(address)"(
      _factory: string,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    transferOwnership(
      _newOwner: string,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "transferOwnership(address)"(
      _newOwner: string,
      overrides?: Overrides
    ): Promise<ContractTransaction>;
  };

  acceptOwnership(overrides?: Overrides): Promise<ContractTransaction>;

  "acceptOwnership()"(overrides?: Overrides): Promise<ContractTransaction>;

  anchorFactories(
    arg0: BigNumberish,
    overrides?: CallOverrides
  ): Promise<string>;

  "anchorFactories(uint16)"(
    arg0: BigNumberish,
    overrides?: CallOverrides
  ): Promise<string>;

  converterFactories(
    arg0: BigNumberish,
    overrides?: CallOverrides
  ): Promise<string>;

  "converterFactories(uint16)"(
    arg0: BigNumberish,
    overrides?: CallOverrides
  ): Promise<string>;

  createAnchor(
    _converterType: BigNumberish,
    _name: string,
    _symbol: string,
    _decimals: BigNumberish,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  "createAnchor(uint16,string,string,uint8)"(
    _converterType: BigNumberish,
    _name: string,
    _symbol: string,
    _decimals: BigNumberish,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  createConverter(
    _type: BigNumberish,
    _anchor: string,
    _registry: string,
    _maxConversionFee: BigNumberish,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  "createConverter(uint16,address,address,uint32)"(
    _type: BigNumberish,
    _anchor: string,
    _registry: string,
    _maxConversionFee: BigNumberish,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  customFactories(
    arg0: BigNumberish,
    overrides?: CallOverrides
  ): Promise<string>;

  "customFactories(uint16)"(
    arg0: BigNumberish,
    overrides?: CallOverrides
  ): Promise<string>;

  newOwner(overrides?: CallOverrides): Promise<string>;

  "newOwner()"(overrides?: CallOverrides): Promise<string>;

  owner(overrides?: CallOverrides): Promise<string>;

  "owner()"(overrides?: CallOverrides): Promise<string>;

  registerTypedConverterAnchorFactory(
    _factory: string,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  "registerTypedConverterAnchorFactory(address)"(
    _factory: string,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  registerTypedConverterCustomFactory(
    _factory: string,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  "registerTypedConverterCustomFactory(address)"(
    _factory: string,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  registerTypedConverterFactory(
    _factory: string,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  "registerTypedConverterFactory(address)"(
    _factory: string,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  transferOwnership(
    _newOwner: string,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  "transferOwnership(address)"(
    _newOwner: string,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  callStatic: {
    acceptOwnership(overrides?: CallOverrides): Promise<void>;

    "acceptOwnership()"(overrides?: CallOverrides): Promise<void>;

    anchorFactories(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<string>;

    "anchorFactories(uint16)"(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<string>;

    converterFactories(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<string>;

    "converterFactories(uint16)"(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<string>;

    createAnchor(
      _converterType: BigNumberish,
      _name: string,
      _symbol: string,
      _decimals: BigNumberish,
      overrides?: CallOverrides
    ): Promise<string>;

    "createAnchor(uint16,string,string,uint8)"(
      _converterType: BigNumberish,
      _name: string,
      _symbol: string,
      _decimals: BigNumberish,
      overrides?: CallOverrides
    ): Promise<string>;

    createConverter(
      _type: BigNumberish,
      _anchor: string,
      _registry: string,
      _maxConversionFee: BigNumberish,
      overrides?: CallOverrides
    ): Promise<string>;

    "createConverter(uint16,address,address,uint32)"(
      _type: BigNumberish,
      _anchor: string,
      _registry: string,
      _maxConversionFee: BigNumberish,
      overrides?: CallOverrides
    ): Promise<string>;

    customFactories(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<string>;

    "customFactories(uint16)"(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<string>;

    newOwner(overrides?: CallOverrides): Promise<string>;

    "newOwner()"(overrides?: CallOverrides): Promise<string>;

    owner(overrides?: CallOverrides): Promise<string>;

    "owner()"(overrides?: CallOverrides): Promise<string>;

    registerTypedConverterAnchorFactory(
      _factory: string,
      overrides?: CallOverrides
    ): Promise<void>;

    "registerTypedConverterAnchorFactory(address)"(
      _factory: string,
      overrides?: CallOverrides
    ): Promise<void>;

    registerTypedConverterCustomFactory(
      _factory: string,
      overrides?: CallOverrides
    ): Promise<void>;

    "registerTypedConverterCustomFactory(address)"(
      _factory: string,
      overrides?: CallOverrides
    ): Promise<void>;

    registerTypedConverterFactory(
      _factory: string,
      overrides?: CallOverrides
    ): Promise<void>;

    "registerTypedConverterFactory(address)"(
      _factory: string,
      overrides?: CallOverrides
    ): Promise<void>;

    transferOwnership(
      _newOwner: string,
      overrides?: CallOverrides
    ): Promise<void>;

    "transferOwnership(address)"(
      _newOwner: string,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {
    NewConverter(
      _type: BigNumberish | null,
      _converter: string | null,
      _owner: string | null
    ): EventFilter;

    OwnerUpdate(
      _prevOwner: string | null,
      _newOwner: string | null
    ): EventFilter;
  };

  estimateGas: {
    acceptOwnership(overrides?: Overrides): Promise<BigNumber>;

    "acceptOwnership()"(overrides?: Overrides): Promise<BigNumber>;

    anchorFactories(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "anchorFactories(uint16)"(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    converterFactories(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "converterFactories(uint16)"(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    createAnchor(
      _converterType: BigNumberish,
      _name: string,
      _symbol: string,
      _decimals: BigNumberish,
      overrides?: Overrides
    ): Promise<BigNumber>;

    "createAnchor(uint16,string,string,uint8)"(
      _converterType: BigNumberish,
      _name: string,
      _symbol: string,
      _decimals: BigNumberish,
      overrides?: Overrides
    ): Promise<BigNumber>;

    createConverter(
      _type: BigNumberish,
      _anchor: string,
      _registry: string,
      _maxConversionFee: BigNumberish,
      overrides?: Overrides
    ): Promise<BigNumber>;

    "createConverter(uint16,address,address,uint32)"(
      _type: BigNumberish,
      _anchor: string,
      _registry: string,
      _maxConversionFee: BigNumberish,
      overrides?: Overrides
    ): Promise<BigNumber>;

    customFactories(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "customFactories(uint16)"(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    newOwner(overrides?: CallOverrides): Promise<BigNumber>;

    "newOwner()"(overrides?: CallOverrides): Promise<BigNumber>;

    owner(overrides?: CallOverrides): Promise<BigNumber>;

    "owner()"(overrides?: CallOverrides): Promise<BigNumber>;

    registerTypedConverterAnchorFactory(
      _factory: string,
      overrides?: Overrides
    ): Promise<BigNumber>;

    "registerTypedConverterAnchorFactory(address)"(
      _factory: string,
      overrides?: Overrides
    ): Promise<BigNumber>;

    registerTypedConverterCustomFactory(
      _factory: string,
      overrides?: Overrides
    ): Promise<BigNumber>;

    "registerTypedConverterCustomFactory(address)"(
      _factory: string,
      overrides?: Overrides
    ): Promise<BigNumber>;

    registerTypedConverterFactory(
      _factory: string,
      overrides?: Overrides
    ): Promise<BigNumber>;

    "registerTypedConverterFactory(address)"(
      _factory: string,
      overrides?: Overrides
    ): Promise<BigNumber>;

    transferOwnership(
      _newOwner: string,
      overrides?: Overrides
    ): Promise<BigNumber>;

    "transferOwnership(address)"(
      _newOwner: string,
      overrides?: Overrides
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    acceptOwnership(overrides?: Overrides): Promise<PopulatedTransaction>;

    "acceptOwnership()"(overrides?: Overrides): Promise<PopulatedTransaction>;

    anchorFactories(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "anchorFactories(uint16)"(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    converterFactories(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "converterFactories(uint16)"(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    createAnchor(
      _converterType: BigNumberish,
      _name: string,
      _symbol: string,
      _decimals: BigNumberish,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "createAnchor(uint16,string,string,uint8)"(
      _converterType: BigNumberish,
      _name: string,
      _symbol: string,
      _decimals: BigNumberish,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    createConverter(
      _type: BigNumberish,
      _anchor: string,
      _registry: string,
      _maxConversionFee: BigNumberish,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "createConverter(uint16,address,address,uint32)"(
      _type: BigNumberish,
      _anchor: string,
      _registry: string,
      _maxConversionFee: BigNumberish,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    customFactories(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "customFactories(uint16)"(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    newOwner(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "newOwner()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    owner(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "owner()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    registerTypedConverterAnchorFactory(
      _factory: string,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "registerTypedConverterAnchorFactory(address)"(
      _factory: string,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    registerTypedConverterCustomFactory(
      _factory: string,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "registerTypedConverterCustomFactory(address)"(
      _factory: string,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    registerTypedConverterFactory(
      _factory: string,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "registerTypedConverterFactory(address)"(
      _factory: string,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    transferOwnership(
      _newOwner: string,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "transferOwnership(address)"(
      _newOwner: string,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;
  };
}