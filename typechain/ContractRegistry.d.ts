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

interface ContractRegistryInterface extends ethers.utils.Interface {
  functions: {
    "acceptOwnership()": FunctionFragment;
    "addressOf(bytes32)": FunctionFragment;
    "contractNames(uint256)": FunctionFragment;
    "getAddress(bytes32)": FunctionFragment;
    "itemCount()": FunctionFragment;
    "newOwner()": FunctionFragment;
    "owner()": FunctionFragment;
    "registerAddress(bytes32,address)": FunctionFragment;
    "transferOwnership(address)": FunctionFragment;
    "unregisterAddress(bytes32)": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "acceptOwnership",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "addressOf",
    values: [BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "contractNames",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "getAddress",
    values: [BytesLike]
  ): string;
  encodeFunctionData(functionFragment: "itemCount", values?: undefined): string;
  encodeFunctionData(functionFragment: "newOwner", values?: undefined): string;
  encodeFunctionData(functionFragment: "owner", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "registerAddress",
    values: [BytesLike, string]
  ): string;
  encodeFunctionData(
    functionFragment: "transferOwnership",
    values: [string]
  ): string;
  encodeFunctionData(
    functionFragment: "unregisterAddress",
    values: [BytesLike]
  ): string;

  decodeFunctionResult(
    functionFragment: "acceptOwnership",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "addressOf", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "contractNames",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "getAddress", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "itemCount", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "newOwner", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "owner", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "registerAddress",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "transferOwnership",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "unregisterAddress",
    data: BytesLike
  ): Result;

  events: {
    "AddressUpdate(bytes32,address)": EventFragment;
    "OwnerUpdate(address,address)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "AddressUpdate"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "OwnerUpdate"): EventFragment;
}

export class ContractRegistry extends Contract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  on(event: EventFilter | string, listener: Listener): this;
  once(event: EventFilter | string, listener: Listener): this;
  addListener(eventName: EventFilter | string, listener: Listener): this;
  removeAllListeners(eventName: EventFilter | string): this;
  removeListener(eventName: any, listener: Listener): this;

  interface: ContractRegistryInterface;

  functions: {
    acceptOwnership(overrides?: Overrides): Promise<ContractTransaction>;

    "acceptOwnership()"(overrides?: Overrides): Promise<ContractTransaction>;

    addressOf(
      _contractName: BytesLike,
      overrides?: CallOverrides
    ): Promise<[string]>;

    "addressOf(bytes32)"(
      _contractName: BytesLike,
      overrides?: CallOverrides
    ): Promise<[string]>;

    contractNames(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[string]>;

    "contractNames(uint256)"(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[string]>;

    getAddress(
      _contractName: BytesLike,
      overrides?: CallOverrides
    ): Promise<[string]>;

    "getAddress(bytes32)"(
      _contractName: BytesLike,
      overrides?: CallOverrides
    ): Promise<[string]>;

    itemCount(overrides?: CallOverrides): Promise<[BigNumber]>;

    "itemCount()"(overrides?: CallOverrides): Promise<[BigNumber]>;

    newOwner(overrides?: CallOverrides): Promise<[string]>;

    "newOwner()"(overrides?: CallOverrides): Promise<[string]>;

    owner(overrides?: CallOverrides): Promise<[string]>;

    "owner()"(overrides?: CallOverrides): Promise<[string]>;

    registerAddress(
      _contractName: BytesLike,
      _contractAddress: string,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "registerAddress(bytes32,address)"(
      _contractName: BytesLike,
      _contractAddress: string,
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

    unregisterAddress(
      _contractName: BytesLike,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "unregisterAddress(bytes32)"(
      _contractName: BytesLike,
      overrides?: Overrides
    ): Promise<ContractTransaction>;
  };

  acceptOwnership(overrides?: Overrides): Promise<ContractTransaction>;

  "acceptOwnership()"(overrides?: Overrides): Promise<ContractTransaction>;

  addressOf(
    _contractName: BytesLike,
    overrides?: CallOverrides
  ): Promise<string>;

  "addressOf(bytes32)"(
    _contractName: BytesLike,
    overrides?: CallOverrides
  ): Promise<string>;

  contractNames(arg0: BigNumberish, overrides?: CallOverrides): Promise<string>;

  "contractNames(uint256)"(
    arg0: BigNumberish,
    overrides?: CallOverrides
  ): Promise<string>;

  getAddress(
    _contractName: BytesLike,
    overrides?: CallOverrides
  ): Promise<string>;

  "getAddress(bytes32)"(
    _contractName: BytesLike,
    overrides?: CallOverrides
  ): Promise<string>;

  itemCount(overrides?: CallOverrides): Promise<BigNumber>;

  "itemCount()"(overrides?: CallOverrides): Promise<BigNumber>;

  newOwner(overrides?: CallOverrides): Promise<string>;

  "newOwner()"(overrides?: CallOverrides): Promise<string>;

  owner(overrides?: CallOverrides): Promise<string>;

  "owner()"(overrides?: CallOverrides): Promise<string>;

  registerAddress(
    _contractName: BytesLike,
    _contractAddress: string,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  "registerAddress(bytes32,address)"(
    _contractName: BytesLike,
    _contractAddress: string,
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

  unregisterAddress(
    _contractName: BytesLike,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  "unregisterAddress(bytes32)"(
    _contractName: BytesLike,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  callStatic: {
    acceptOwnership(overrides?: CallOverrides): Promise<void>;

    "acceptOwnership()"(overrides?: CallOverrides): Promise<void>;

    addressOf(
      _contractName: BytesLike,
      overrides?: CallOverrides
    ): Promise<string>;

    "addressOf(bytes32)"(
      _contractName: BytesLike,
      overrides?: CallOverrides
    ): Promise<string>;

    contractNames(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<string>;

    "contractNames(uint256)"(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<string>;

    getAddress(
      _contractName: BytesLike,
      overrides?: CallOverrides
    ): Promise<string>;

    "getAddress(bytes32)"(
      _contractName: BytesLike,
      overrides?: CallOverrides
    ): Promise<string>;

    itemCount(overrides?: CallOverrides): Promise<BigNumber>;

    "itemCount()"(overrides?: CallOverrides): Promise<BigNumber>;

    newOwner(overrides?: CallOverrides): Promise<string>;

    "newOwner()"(overrides?: CallOverrides): Promise<string>;

    owner(overrides?: CallOverrides): Promise<string>;

    "owner()"(overrides?: CallOverrides): Promise<string>;

    registerAddress(
      _contractName: BytesLike,
      _contractAddress: string,
      overrides?: CallOverrides
    ): Promise<void>;

    "registerAddress(bytes32,address)"(
      _contractName: BytesLike,
      _contractAddress: string,
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

    unregisterAddress(
      _contractName: BytesLike,
      overrides?: CallOverrides
    ): Promise<void>;

    "unregisterAddress(bytes32)"(
      _contractName: BytesLike,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {
    AddressUpdate(
      _contractName: BytesLike | null,
      _contractAddress: null
    ): EventFilter;

    OwnerUpdate(
      _prevOwner: string | null,
      _newOwner: string | null
    ): EventFilter;
  };

  estimateGas: {
    acceptOwnership(overrides?: Overrides): Promise<BigNumber>;

    "acceptOwnership()"(overrides?: Overrides): Promise<BigNumber>;

    addressOf(
      _contractName: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "addressOf(bytes32)"(
      _contractName: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    contractNames(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "contractNames(uint256)"(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getAddress(
      _contractName: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "getAddress(bytes32)"(
      _contractName: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    itemCount(overrides?: CallOverrides): Promise<BigNumber>;

    "itemCount()"(overrides?: CallOverrides): Promise<BigNumber>;

    newOwner(overrides?: CallOverrides): Promise<BigNumber>;

    "newOwner()"(overrides?: CallOverrides): Promise<BigNumber>;

    owner(overrides?: CallOverrides): Promise<BigNumber>;

    "owner()"(overrides?: CallOverrides): Promise<BigNumber>;

    registerAddress(
      _contractName: BytesLike,
      _contractAddress: string,
      overrides?: Overrides
    ): Promise<BigNumber>;

    "registerAddress(bytes32,address)"(
      _contractName: BytesLike,
      _contractAddress: string,
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

    unregisterAddress(
      _contractName: BytesLike,
      overrides?: Overrides
    ): Promise<BigNumber>;

    "unregisterAddress(bytes32)"(
      _contractName: BytesLike,
      overrides?: Overrides
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    acceptOwnership(overrides?: Overrides): Promise<PopulatedTransaction>;

    "acceptOwnership()"(overrides?: Overrides): Promise<PopulatedTransaction>;

    addressOf(
      _contractName: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "addressOf(bytes32)"(
      _contractName: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    contractNames(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "contractNames(uint256)"(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getAddress(
      _contractName: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "getAddress(bytes32)"(
      _contractName: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    itemCount(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "itemCount()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    newOwner(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "newOwner()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    owner(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "owner()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    registerAddress(
      _contractName: BytesLike,
      _contractAddress: string,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "registerAddress(bytes32,address)"(
      _contractName: BytesLike,
      _contractAddress: string,
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

    unregisterAddress(
      _contractName: BytesLike,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "unregisterAddress(bytes32)"(
      _contractName: BytesLike,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;
  };
}