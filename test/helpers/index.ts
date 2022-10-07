import { Interface } from "@ethersproject/abi";
import { ContractTransaction, ethers, providers } from "ethers";

export const getSubnodeHash = (
  parentHash: string,
  labelHash: string
): string => {
  const calculatedHash = ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      ["bytes32", "bytes32"],
      [ethers.utils.arrayify(parentHash), ethers.utils.arrayify(labelHash)]
    )
  );

  return calculatedHash;
};

export const hashDomainName = (name: string): string => {
  const hash = ethers.utils.id(name);
  return hash;
};

export const calculateDomainHash = getSubnodeHash;

export const domainNameToId = (name: string): string => {
  let hashReturn = ethers.constants.HashZero;

  if (name === "" || undefined || null) {
    return hashReturn;
  }

  const domains = name.split(".");
  for (let i = 0; i < domains.length; i++) {
    hashReturn = getSubnodeHash(hashReturn, ethers.utils.id(domains[i]));
  }
  return hashReturn;
};

/* eslint-disable @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any */
export function filterLogsWithTopics(
  logs: providers.Log[],
  topic: any,
  contractAddress: string
): ethers.providers.Log[] {
  return logs
    .filter((log) => log.topics.includes(topic))
    .filter(
      (log) =>
        log.address &&
        log.address.toLowerCase() === contractAddress.toLowerCase()
    );
}
/* eslint-enable @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any */

export async function getEvents(
  tx: ContractTransaction,
  event: string,
  contract: string,
  abi: Interface
): Promise<ethers.utils.LogDescription[]> {
  const receipt = await tx.wait();
  const topic = abi.getEventTopic(event);
  const logs = filterLogsWithTopics(receipt.logs, topic, contract);
  const events = logs.map((e) => abi.parseLog(e));

  return events;
}

export async function getEvent(
  tx: ContractTransaction,
  event: string,
  contract: string,
  abi: Interface
): Promise<ethers.utils.LogDescription> {
  const events = await getEvents(tx, event, contract, abi);
  const firstEvent = events[0];
  return firstEvent;
}

export type EventMappingType = { [name: string]: ethers.utils.LogDescription };

export async function getAllEvents(
  tx: ContractTransaction,
  contract: string,
  abi: Interface
): Promise<EventMappingType> {
  const receipt = await tx.wait();
  const keys = Object.keys(abi.events);
  const events = keys.reduce((prev: EventMappingType, current: string) => {
    const logs = filterLogsWithTopics(receipt.logs, abi.getEventTopic(current), contract);
    if (logs.length < 1) {
      return prev;
    }
    return {
      ...prev,
      [current]: abi.parseLog(logs[0])
    }
  }, {});
  return events;
}