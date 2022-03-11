import { Contract, ContractTransaction, ethers, providers } from "ethers";
export declare const getSubnodeHash: (parentHash: string, labelHash: string) => string;
export declare const hashDomainName: (name: string) => string;
export declare const calculateDomainHash: (parentHash: string, labelHash: string) => string;
export declare function filterLogsWithTopics(logs: providers.Log[], topic: any, contractAddress: string): ethers.providers.Log[];
export declare function getEvents(tx: ContractTransaction, event: string, contract: Contract): Promise<ethers.utils.LogDescription[]>;
export declare function getEvent(tx: ContractTransaction, event: string, contract: Contract): Promise<ethers.utils.LogDescription>;
