import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ethers, upgrades } from "hardhat";

import chai from "chai";
import { solidity } from "ethereum-waffle";
import {
  BasicController,
  BasicController__factory,
  Registrar,
  Registrar__factory,
} from "../typechain";
import { getEvent } from "./helpers";

chai.use(solidity);
const { expect } = chai;

describe("End 2 End Tests", () => {
  let accounts: SignerWithAddress[];

  let creator: SignerWithAddress;
  let controllerCreator: SignerWithAddress;

  let admin: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;

  let registrar: Registrar;
  let registrarAsAdmin: Registrar;

  let registrarAsUser1: Registrar;
  let registrarAsUser2: Registrar;
  let registrarAsUser3: Registrar;

  let controller: BasicController;
  let controllerAsAdmin: BasicController;

  let controllerAsUser1: BasicController;
  let controllerAsUser2: BasicController;
  let controllerAsUser3: BasicController;

  const rootDomain = ethers.constants.HashZero;

  before(async () => {
    accounts = await ethers.getSigners();
    creator = accounts[0];
    controllerCreator = accounts[1];
    admin = accounts[2];
    user1 = accounts[3];
    user2 = accounts[4];
    user3 = accounts[5];
  });

  describe("setup", () => {
    it("deploy Registrar", async () => {
      const registrarFactory = new Registrar__factory(creator);
      registrar = await registrarFactory.deploy();
      await registrar.initialize();

      registrarAsUser1 = registrar.connect(user1);
      registrarAsUser2 = registrar.connect(user2);
      registrarAsUser3 = registrar.connect(user3);
      registrarAsAdmin = registrar.connect(admin);
    });

    it("transfers root domain to admin", async () => {
      await registrar.transferFrom(creator.address, admin.address, rootDomain);

      expect(await registrar.ownerOf(rootDomain)).to.eq(admin.address);
    });

    it("deploy basic controller", async () => {
      const controllerFactory = new BasicController__factory(controllerCreator);
      controller = await controllerFactory.deploy();
      await controller.initialize(registrar.address);

      controllerAsAdmin = controller.connect(admin);
      controllerAsUser1 = controller.connect(user1);
      controllerAsUser2 = controller.connect(user2);
      controllerAsUser3 = controller.connect(user3);
    });

    it("owner of registrar adds controller", async () => {
      await registrar.addController(controller.address);

      expect(await registrar["controllers(address)"](controller.address)).to.be
        .true;
    });
  });

  describe("scenario 1", () => {
    const domain1Name = "user1";
    let domain1Id: string;

    it("admin creates user1 a domain through controller", async () => {
      const tx = await controllerAsAdmin.registerDomain(
        domain1Name,
        user1.address
      );

      const event = await getEvent(tx, "RegisteredDomain", controllerAsAdmin);

      domain1Id = event.args["id"];

      expect(await registrar.ownerOf(domain1Id)).to.eq(user1.address);
    });

    it("user1 transfers domain to user2", async () => {
      await registrarAsUser1.transferFrom(
        user1.address,
        user2.address,
        domain1Id
      );

      expect(await registrar.ownerOf(domain1Id)).to.eq(user2.address);
    });

    it("user2 sets domain content, royalty, and locks it", async () => {
      const metadataUri = "someuri";
      let tx = await registrarAsUser2.setDomainMetadataUri(
        domain1Id,
        metadataUri
      );
      let event = await getEvent(tx, "MetadataChanged", registrarAsUser2);

      expect(event.args["uri"]).to.eq(metadataUri);

      const royaltyAmount = 100;
      tx = await registrarAsUser2.setDomainRoyaltyAmount(
        domain1Id,
        royaltyAmount
      );
      event = await getEvent(tx, "RoyaltiesAmountChanged", registrarAsUser2);

      expect(event.args["amount"]).to.eq(royaltyAmount);

      tx = await registrarAsUser2.lockDomainMetadata(domain1Id);
      expect(await registrarAsUser2.isDomainMetadataLocked(domain1Id)).to.be
        .true;
    });

    it("user2 transfers domain back to user1", async () => {
      await registrarAsUser2.transferFrom(
        user2.address,
        user1.address,
        domain1Id
      );

      expect(await registrar.ownerOf(domain1Id)).to.eq(user1.address);
    });

    it("user1 is unable to set metadata or royalty", async () => {
      let tx = registrarAsUser1.setDomainMetadataUri(domain1Id, "blah");
      await expect(tx).to.be.revertedWith("Metadata locked");

      tx = registrarAsUser1.setDomainRoyaltyAmount(domain1Id, 0);
      await expect(tx).to.be.revertedWith("Not locker");
    });
  });
});
