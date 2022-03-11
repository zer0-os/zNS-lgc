"use strict";
/**
 * This script is used to create a simulated environment.
 * It will target a deployed version of the `Registrar` contract.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = require("hardhat");
const helpers_1 = require("../test/helpers");
const typechain_1 = require("../typechain");
const utilities_1 = require("../utilities");
const logger = utilities_1.getLogger("scripts::simulate");
async function main() {
    if (hardhat_1.network.name != "kovan") {
        logger.error(`Only kovan network is supported when simulating an environment.`);
        return;
    }
    const deploymentData = utilities_1.getDeploymentData(hardhat_1.network.name);
    if (!deploymentData.registrar) {
        throw new Error(`No deployment data found for the registrar`);
    }
    logger.log(`Simulating usage on ${deploymentData.registrar.address}`);
    logger.log(`Please ensure that you've run the 'send-eth' script so the test accounts have eth for gas.`);
    logger.warn(`Simulation should only be done on a freshly deployed contract`);
    const accounts = await hardhat_1.ethers.getSigners();
    const creator = accounts[0];
    const controller = accounts[1];
    const users = [...accounts];
    users.splice(0, 2); // remove the creator and the controller
    users.splice(5); // only have 5 accounts
    const factory = new typechain_1.Registrar__factory(creator);
    let registrar = await factory.attach(deploymentData.registrar.address);
    // add the controller as the owner
    logger.log(`Adding controller`);
    let tx = await registrar.addController(controller.address);
    await tx.wait();
    // switch to using as the controller
    registrar = registrar.connect(controller);
    const rootDomain = hardhat_1.ethers.constants.HashZero;
    // create top level domains
    let wordIndex = 0;
    const createdDomains = [];
    const topLevelDomainsToCreate = [];
    for (const user of users) {
        topLevelDomainsToCreate.push({
            owner: user,
            name: utilities_1.getWord(wordIndex++),
        });
    }
    for (const domainToCreate of topLevelDomainsToCreate) {
        logger.log(`Creating top level domain ${domainToCreate.name}`);
        try {
            tx = await registrar.registerDomain(rootDomain, domainToCreate.name, domainToCreate.owner.address, domainToCreate.owner.address);
            logger.debug(`waiting for tx to finish`);
            await tx.wait();
        }
        catch (e) {
            logger.debug(`failed... continuing`);
        }
        createdDomains.push({
            owner: domainToCreate.owner,
            id: helpers_1.calculateDomainHash(rootDomain, helpers_1.hashDomainName(domainToCreate.name)),
            parent: rootDomain,
            name: domainToCreate.name,
            fullName: domainToCreate.name,
            depth: 0,
            creator: domainToCreate.owner,
        });
    }
    const subDomainsToCreate = [];
    for (const user of users) {
        subDomainsToCreate.push({
            parent: createdDomains[0],
            owner: user,
            name: utilities_1.getWord(wordIndex++),
        });
    }
    for (const domainToCreate of subDomainsToCreate) {
        logger.log(`Creating subdomain ${domainToCreate.parent.name}.${domainToCreate.name}`);
        try {
            const tx = await registrar.registerDomain(domainToCreate.parent.id, domainToCreate.name, domainToCreate.owner.address, domainToCreate.parent.owner.address);
            logger.debug(`waiting for tx to finish`);
            await tx.wait();
        }
        catch (e) {
            logger.debug(`failed... continuing`);
        }
        createdDomains.push({
            owner: domainToCreate.owner,
            name: domainToCreate.name,
            id: helpers_1.calculateDomainHash(domainToCreate.parent.id, helpers_1.hashDomainName(domainToCreate.name)),
            parent: domainToCreate.parent.id,
            depth: domainToCreate.parent.depth + 1,
            parentDomain: domainToCreate.parent,
            fullName: `${domainToCreate.parent.fullName}.${domainToCreate.name}`,
            creator: domainToCreate.parent.owner,
        });
    }
    // transfer some domains
    for (let i = 0; i < createdDomains.length; ++i) {
        const domain = createdDomains[i];
        // use registrar as owner
        registrar = registrar.connect(domain.owner);
        const userToTransferTo = users[(i + 1) % users.length];
        try {
            logger.log(`transferring ownership of ${domain.fullName} to ${userToTransferTo.address}`);
            tx = await registrar.transferFrom(domain.owner.address, userToTransferTo.address, domain.id);
            await tx.wait();
        }
        catch (e) {
            logger.debug(`failed... continuing`);
        }
        domain.owner = userToTransferTo;
    }
    // play with metadata
    {
        const domain = createdDomains[0];
        // use registrar the owner
        registrar = registrar.connect(domain.owner);
        logger.log(`setting metadata uri on ${domain.fullName}`);
        tx = await registrar.setDomainMetadataUri(domain.id, "google.com");
        await tx.wait();
        logger.log(`locking metadata uri on ${domain.fullName}`);
        tx = await registrar.lockDomainMetadata(domain.id);
        await tx.wait();
        logger.log(`unlocking metadata uri on ${domain.fullName}`);
        tx = await registrar.unlockDomainMetadata(domain.id);
        await tx.wait();
        // use registrar the creator
        logger.log(`setting domain royalty amount on ${domain.fullName}`);
        tx = await registrar.setDomainRoyaltyAmount(domain.id, "10000");
        await tx.wait();
    }
}
main()
    .then(() => {
    process.exit(0);
})
    .catch((e) => {
    logger.error(`Failed to create simulated environment: ${e}`);
    if (e.code) {
        logger.error(`Error code: ${e.code}`);
    }
    if (e.data) {
        logger.error(`Data: ${e.data}`);
    }
    if (e.message) {
        logger.error(`Message: ${e.message}`);
    }
    process.exit(1);
});
