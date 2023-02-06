import { ethers } from "hardhat";

export enum TestAccounts {
  AccountA,
  AccountB,
  AccountC,
  AccountD
}

export enum DomainKind {
  PureDomain,
  BeaconDomain
}

interface MintDomainConfig {
  "tx.origin": TestAccounts;
  id: string;
  parentId: string;
  label: string;
  name: string;
  metadataUri: string;
  sendToUser: TestAccounts;
  domainKind: DomainKind;
}

export const mintSenario: MintDomainConfig[] = [
  {
    "tx.origin": TestAccounts.AccountA,
    id: "0x196c0a1e30004b9998c97b363e44f1f4e97497e59d52ad151208e9393d70bb3b",
    parentId: ethers.constants.HashZero,
    label: "wilder",
    name: "wilder",
    metadataUri: "ipfs://QmSQTLzzsPS67ay4SFKMv9Dq57iSQ7pLWQVUvS3XB5MowK/0",
    sendToUser: TestAccounts.AccountA,
    domainKind: DomainKind.PureDomain,
  },
  {
    "tx.origin": TestAccounts.AccountB,
    id: "0x2c8c7428bc02f30bce3c83a7e781e6e622a3ff37ba4161179bd63b9554799cc8",
    parentId: "0x196c0a1e30004b9998c97b363e44f1f4e97497e59d52ad151208e9393d70bb3b", // wilder
    label: "concept",
    name: "wilder.concept",
    metadataUri: "ipfs://QmSQTLzzsPS67ay4SFKMv9Dq57iSQ7pLWQVUvS3XB5MowK/110",
    sendToUser: TestAccounts.AccountB,
    domainKind: DomainKind.BeaconDomain,
  },
  {
    "tx.origin": TestAccounts.AccountC,
    id: "0x577547c6712ef7f054d8d593d46fa708f6cd8c455c707d779a08870d09f52ef5",
    parentId: "0x2c8c7428bc02f30bce3c83a7e781e6e622a3ff37ba4161179bd63b9554799cc8", // wilder.concept
    label: "environment",
    name: "wilder.concept.environment",
    metadataUri: "ipfs://QmSQTLzzsPS67ay4SFKMv9Dq57iSQ7pLWQVUvS3XB5MowK/111",
    sendToUser: TestAccounts.AccountC,
    domainKind: DomainKind.BeaconDomain,
  },
  {
    "tx.origin": TestAccounts.AccountD,
    id: "0x938ec331d6a5759665924e8536b43f2a563d3d230cc609d926bcc680de33d7fd",
    parentId: "0x577547c6712ef7f054d8d593d46fa708f6cd8c455c707d779a08870d09f52ef5", // wilder.concept.environment
    label: "metaroad",
    name: "wilder.concept.environment.metaroad",
    metadataUri: "ipfs://QmSQTLzzsPS67ay4SFKMv9Dq57iSQ7pLWQVUvS3XB5MowK/114",
    sendToUser: TestAccounts.AccountD,
    domainKind: DomainKind.PureDomain,
  },
  {
    "tx.origin": TestAccounts.AccountD,
    id: "0x5cbdddde02450ebaff467053c64e5821efc3aacbe9bdf6d3033c3f22ccdcbd7b",
    parentId: "0x577547c6712ef7f054d8d593d46fa708f6cd8c455c707d779a08870d09f52ef5", // wilder.concept.environment
    label: "wildstreets",
    name: "wilder.concept.environment.wildstreets",
    metadataUri: "ipfs://QmSQTLzzsPS67ay4SFKMv9Dq57iSQ7pLWQVUvS3XB5MowK/115",
    sendToUser: TestAccounts.AccountD,
    domainKind: DomainKind.PureDomain,
  },
  {
    "tx.origin": TestAccounts.AccountD,
    id: "0xd36b0c70f4b8c0c7693035df5d0f34921c33708a930cb410c72d05b5502f1bb4",
    parentId: "0x577547c6712ef7f054d8d593d46fa708f6cd8c455c707d779a08870d09f52ef5", // wilder.concept.environment
    label: "wildcity",
    name: "wilder.concept.environment.wildcity",
    metadataUri: 
    "ipfs://QmSQTLzzsPS67ay4SFKMv9Dq57iSQ7pLWQVUvS3XB5MowK/116",
    sendToUser: TestAccounts.AccountD,
    domainKind: DomainKind.PureDomain,
  }
]