import { Contract, ContractTransaction, ethers, providers } from "ethers";

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

export const hashDomainName = (name: string) => {
  const hash = ethers.utils.id(name);
  return hash;
};

export const calculateDomainHash = getSubnodeHash;

export function filterLogsWithTopics(
  logs: providers.Log[],
  topic: any,
  contractAddress: string
) {
  return logs
    .filter((log) => log.topics.includes(topic))
    .filter(
      (log) =>
        log.address &&
        log.address.toLowerCase() === contractAddress.toLowerCase()
    );
}

export async function getEvents(
  tx: ContractTransaction,
  event: string,
  contract: Contract
) {
  const receipt = await tx.wait();
  const topic = contract.interface.getEventTopic(event);
  const logs = filterLogsWithTopics(receipt.logs, topic, contract.address);
  const events = logs.map((e) => contract.interface.parseLog(e));

  return events;
}

export async function getEvent(
  tx: ContractTransaction,
  event: string,
  contract: Contract
) {
  const events = await getEvents(tx, event, contract);
  const firstEvent = events[0];
  return firstEvent;
}
