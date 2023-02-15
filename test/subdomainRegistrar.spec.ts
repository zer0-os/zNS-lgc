import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ethers } from "hardhat";
import { Registrar, ZNSHub, Registrar__factory } from "../typechain";
import chai from "chai";
import { BigNumber, BigNumberish } from "ethers";
import { domainNameToId, getEvent } from "./helpers";
import { deployZNS } from "./helpers/deploy";

const { expect } = chai;

describe("Subdomain Registrar Functionality", () => {
  let accounts: SignerWithAddress[];
  let registrar: Registrar;
  let zNSHub: ZNSHub;
  const creatorAccountIndex = 0;
  let creator: SignerWithAddress;
  const rootDomainId = BigNumber.from(0);

  const createSubdomainContract = async (
    contract: Registrar,
    minter: SignerWithAddress,
    parentId: BigNumberish,
    label: string
  ) => {
    const tx = await contract.registerSubdomainContract(
      parentId,
      label,
      minter.address,
      "metadata",
      0,
      true,
      minter.address
    );
    const event = await getEvent(
      tx,
      "EENewSubdomainRegistrar",
      zNSHub.address,
      zNSHub.interface
    );
    return Registrar__factory.connect(
      event.args["childRegistrar"],
      contract.signer
    );
  };

  before(async () => {
    accounts = await ethers.getSigners();
    creator = accounts[creatorAccountIndex];
  });

  describe("Subdomain contract creation", () => {
    before(async () => {
      ({ registrar, zNSHub } = await deployZNS(creator));
      await registrar.addController(creator.address);
    });

    let subdomainRegistrar: Registrar;
    const domainName = "foo";
    const domainId = domainNameToId(domainName);

    it("can create subdomain contracts", async () => {
      const tx = await registrar.registerSubdomainContract(
        rootDomainId,
        domainName,
        creator.address,
        "somemetadata",
        0,
        true,
        creator.address
      );

      expect(tx).to.emit(zNSHub, "EENewSubdomainRegistrar");
      const event = await getEvent(
        tx,
        "EENewSubdomainRegistrar",
        zNSHub.address,
        zNSHub.interface
      );
      subdomainRegistrar = Registrar__factory.connect(
        event.args["childRegistrar"],
        creator
      );
    });

    it("subdomain registrar returns proper owner", async () => {
      const ownerOnRoot = await registrar.ownerOf(domainId);
      const ownerOnSub = await registrar.ownerOf(domainId);

      expect(ownerOnRoot).to.eq(ownerOnSub);
    });

    it("prevents subdomains from being minted on root", async () => {
      const tx = registrar.registerDomain(
        domainId,
        "bar",
        creator.address,
        "blahmetadata",
        0,
        true
      );

      await expect(tx).to.be.reverted;
    });

    it("allows root owner to add controller on subdomain contract", async () => {
      await subdomainRegistrar.addController(creator.address);
    });

    it("allows subdomains to be minted on subdomain contract", async () => {
      await expect(
        subdomainRegistrar.registerDomain(
          domainId,
          "bar",
          creator.address,
          "metdata1",
          0,
          true
        )
      ).to.be.not.reverted;
    });
  });

  describe("ownerOf", () => {
    before(async () => {
      const { registrar, zNSHub } = await deployZNS(creator);
      registrar = registrar;
      zNSHub = zNSHub;
      await registrar.addController(creator.address);
    });

    it("ownerOf returns owner of root domain in subdomain contract", async () => {
      const childRegistrar = await createSubdomainContract(
        registrar,
        creator,
        0,
        "foo"
      );

      expect(await childRegistrar.ownerOf(0)).to.eq(await registrar.ownerOf(0));
    });
  });
});
