"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEvent = exports.getEvents = exports.filterLogsWithTopics = exports.calculateDomainHash = exports.hashDomainName = exports.getSubnodeHash = void 0;
const ethers_1 = require("ethers");
const getSubnodeHash = (parentHash, labelHash) => {
    const calculatedHash = ethers_1.ethers.utils.keccak256(ethers_1.ethers.utils.defaultAbiCoder.encode(["bytes32", "bytes32"], [ethers_1.ethers.utils.arrayify(parentHash), ethers_1.ethers.utils.arrayify(labelHash)]));
    return calculatedHash;
};
exports.getSubnodeHash = getSubnodeHash;
const hashDomainName = (name) => {
    const hash = ethers_1.ethers.utils.id(name);
    return hash;
};
exports.hashDomainName = hashDomainName;
exports.calculateDomainHash = exports.getSubnodeHash;
/* eslint-disable @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any */
function filterLogsWithTopics(logs, topic, contractAddress) {
    return logs
        .filter((log) => log.topics.includes(topic))
        .filter((log) => log.address &&
        log.address.toLowerCase() === contractAddress.toLowerCase());
}
exports.filterLogsWithTopics = filterLogsWithTopics;
/* eslint-enable @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any */
async function getEvents(tx, event, contract) {
    const receipt = await tx.wait();
    const topic = contract.interface.getEventTopic(event);
    const logs = filterLogsWithTopics(receipt.logs, topic, contract.address);
    const events = logs.map((e) => contract.interface.parseLog(e));
    return events;
}
exports.getEvents = getEvents;
async function getEvent(tx, event, contract) {
    const events = await getEvents(tx, event, contract);
    const firstEvent = events[0];
    return firstEvent;
}
exports.getEvent = getEvent;
