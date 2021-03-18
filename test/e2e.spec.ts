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
  let controller: BasicController;

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
    });

    it("transfers root domain to admin", async () => {
      await registrar.transferFrom(creator.address, admin.address, rootDomain);

      expect(await registrar.ownerOf(rootDomain)).to.eq(admin.address);
    });

    it("deploy basic controller", async () => {
      const controllerFactory = new BasicController__factory(controllerCreator);
      controller = await controllerFactory.deploy();
      await controller.initialize(registrar.address);
    });

    it("owner of registrar adds controller", async () => {
      await registrar.addController(controller.address);

      expect(await registrar["controllers(address)"](controller.address)).to.be
        .true;
    });
  });

  describe("scenario 1", async () => {
    // test scenario 1
  });
});
