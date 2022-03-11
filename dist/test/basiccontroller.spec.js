"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = require("hardhat");
const chai_1 = __importDefault(require("chai"));
const ethereum_waffle_1 = require("ethereum-waffle");
const registrar = __importStar(require("../artifacts/contracts/Registrar.sol/Registrar.json"));
const typechain_1 = require("../typechain");
chai_1.default.use(ethereum_waffle_1.solidity);
const { expect } = chai_1.default;
describe("Basic Controller", () => {
    let accounts;
    let creator;
    let user1;
    let user2;
    let user3;
    let registrarMock;
    let controllerFactory;
    let controller;
    before(async () => {
        accounts = await hardhat_1.ethers.getSigners();
        creator = accounts[0];
        user1 = accounts[1];
        user2 = accounts[2];
        user3 = accounts[3];
    });
    describe("register top level domains", () => {
        before("deploys", async () => {
            registrarMock = await hardhat_1.waffle.deployMockContract(creator, registrar.abi);
            controllerFactory = new typechain_1.BasicController__factory(creator);
            controller = (await hardhat_1.upgrades.deployProxy(controllerFactory, [registrarMock.address], {
                initializer: "initialize",
            }));
            controller = await controller.deployed();
        });
        it("emits a RegisteredDomain event with the created domain id", async () => {
            const domainName = "myDomain";
            const returnedId = 1337;
            await registrarMock.mock.domainExists.withArgs(0).returns(true);
            await registrarMock.mock.ownerOf.withArgs(0).returns(user1.address);
            await registrarMock.mock.registerDomain.returns(returnedId);
            const controllerAsUser1 = await controller.connect(user1);
            const tx = await controllerAsUser1.registerSubdomainExtended(0, domainName, user1.address, "", 0, false);
            expect(tx)
                .to.emit(controller, "RegisteredDomain")
                .withArgs(domainName, returnedId, 0, user1.address, user1.address);
        });
        it("prevents a user who is not the root domain owner from making a domain", async () => {
            const domainName = "myDomain";
            const returnedId = 1337;
            await registrarMock.mock.domainExists.withArgs(0).returns(true);
            await registrarMock.mock.ownerOf.withArgs(0).returns(user1.address);
            await registrarMock.mock.registerDomain.returns(returnedId);
            const controllerAsUser2 = await controller.connect(user2);
            const tx = controllerAsUser2.registerSubdomainExtended(0, domainName, user1.address, "", 0, false);
            await expect(tx).to.be.revertedWith("Zer0 Controller: Not Authorized");
        });
    });
    describe("register sub domains", () => {
        const topLevelDomainId = 80008;
        before("deploys", async () => {
            registrarMock = await hardhat_1.waffle.deployMockContract(creator, registrar.abi);
            controllerFactory = new typechain_1.BasicController__factory(creator);
            controller = (await hardhat_1.upgrades.deployProxy(controllerFactory, [registrarMock.address], {
                initializer: "initialize",
            }));
            controller = await controller.deployed();
        });
        it("emits a RegisteredSubdomain event with the created domain id", async () => {
            const domainName = "mySubDomain";
            const returnedId = 13361357;
            await registrarMock.mock.domainExists
                .withArgs(topLevelDomainId)
                .returns(true);
            await registrarMock.mock.ownerOf
                .withArgs(topLevelDomainId)
                .returns(user2.address);
            await registrarMock.mock.registerDomain.returns(returnedId);
            const controllerAsUser2 = await controller.connect(user2);
            const tx = await controllerAsUser2.registerSubdomainExtended(topLevelDomainId, domainName, user2.address, "", 0, false);
            expect(tx)
                .to.emit(controller, "RegisteredDomain")
                .withArgs(domainName, returnedId, topLevelDomainId, user2.address, user2.address);
        });
        it("prevents a user who is not the owner of a domain from creating sub domains", async () => {
            const domainName = "mySubDomain";
            const returnedId = 13361357;
            await registrarMock.mock.domainExists
                .withArgs(topLevelDomainId)
                .returns(true);
            await registrarMock.mock.ownerOf
                .withArgs(topLevelDomainId)
                .returns(user2.address);
            await registrarMock.mock.registerDomain.returns(returnedId);
            const controllerAsUser3 = await controller.connect(user3);
            const tx = controllerAsUser3.registerSubdomainExtended(topLevelDomainId, domainName, user3.address, "", 0, false);
            await expect(tx).to.be.revertedWith("Zer0 Controller: Not Authorized");
        });
        it("prevents creating subdomains on domains with no parent", async () => {
            const parentId = 11111;
            const domainName = "mySubDomain";
            const returnedId = 13361357;
            await registrarMock.mock.ownerOf
                .withArgs(parentId)
                .revertsWithReason("ERC721: owner query for nonexistent token");
            await registrarMock.mock.domainExists.withArgs(parentId).returns(false);
            await registrarMock.mock.registerDomain.returns(returnedId);
            const controllerAsUser2 = await controller.connect(user2);
            const tx = controllerAsUser2.registerSubdomainExtended(parentId, domainName, user2.address, "", 0, false);
            await expect(tx).to.be.revertedWith("ERC721: owner query for nonexistent token");
        });
    });
});
