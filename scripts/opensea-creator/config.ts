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
    id: "0x196c0a1e30004b9998c97b363e44f1f4e97497e59d52ad151208e9393d70bb3b", // wilder
    parentId: ethers.constants.HashZero,
    label: "wilder",
    name: "wilder",
    metadataUri: "ipfs://QmSQTLzzsPS67ay4SFKMv9Dq57iSQ7pLWQVUvS3XB5MowK/0",
    sendToUser: TestAccounts.AccountA,
    domainKind: DomainKind.PureDomain,
  },
  {
    "tx.origin": TestAccounts.AccountB,
    id: "0x79e5bdb3f024a898df02a5472e6fc5373e6a3c5f65317f58223a579d518378df", // wilder.kicks
    parentId: "0x196c0a1e30004b9998c97b363e44f1f4e97497e59d52ad151208e9393d70bb3b", // wilder
    label: "kicks",
    name: "wilder.kicks",
    metadataUri: "ipfs://QmSQTLzzsPS67ay4SFKMv9Dq57iSQ7pLWQVUvS3XB5MowK/5",
    sendToUser: TestAccounts.AccountB,
    domainKind: DomainKind.BeaconDomain,
  },
  {
    "tx.origin": TestAccounts.AccountC,
    id: "0x9ef46671e570343a0149dcff31e10f195790e504de5b6a6b8a5578da5cc2a54c", // wilder.kicks.airwild
    parentId: "0x79e5bdb3f024a898df02a5472e6fc5373e6a3c5f65317f58223a579d518378df", // wilder.kicks
    label: "airwild",
    name: "wilder.kicks.airwild",
    metadataUri: "ipfs://QmSQTLzzsPS67ay4SFKMv9Dq57iSQ7pLWQVUvS3XB5MowK/6",
    sendToUser: TestAccounts.AccountC,
    domainKind: DomainKind.BeaconDomain,
  },
  {
    "tx.origin": TestAccounts.AccountD,
    id: "0x1badd5424f77b34024ce6ca99fa03c10e5e1f46298f841de30d6fcecb6b846ad", // wilder.kicks.sesion0
    parentId: "0x9ef46671e570343a0149dcff31e10f195790e504de5b6a6b8a5578da5cc2a54c", // wilder.kicks
    label: "season0",
    name: "wilder.kicks.airwild.season0",
    metadataUri: "ipfs://QmSQTLzzsPS67ay4SFKMv9Dq57iSQ7pLWQVUvS3XB5MowK/7",
    sendToUser: TestAccounts.AccountD,
    domainKind: DomainKind.PureDomain,
  },
  {
    "tx.origin": TestAccounts.AccountD,
    id: "0x99f58bd76da4ca166dac9a7adbae7a8d10656a28a38d8fe029e103b881831e66", // wilder.kicks.season1
    parentId: "0x9ef46671e570343a0149dcff31e10f195790e504de5b6a6b8a5578da5cc2a54c", // wilder
    label: "season1",
    name: "wilder.kicks.airwild.season1",
    metadataUri: "ipfs://QmdUzKo3CgnpgPtvbX6waGk31zQQwoM3SuYjaXk7F1b5FU",
    sendToUser: TestAccounts.AccountD,
    domainKind: DomainKind.PureDomain,
  },
  {
    "tx.origin": TestAccounts.AccountD,
    id: "0x653a99cbe1e215988c0aae2685cf952f62d2ab7432c10ddb383a7847577d70d2", // wilder.kicks.season2
    parentId: "0x9ef46671e570343a0149dcff31e10f195790e504de5b6a6b8a5578da5cc2a54c", // wilder
    label: "season2",
    name: "wilder.kicks.airwild.season2",
    metadataUri: 
    "ipfs://Qmbre1QprMHmGsBfpjv4k9gxV9rqqxwxj58CQJW6VEsWRq",
    sendToUser: TestAccounts.AccountD,
    domainKind: DomainKind.PureDomain,
  }
]