import { ethers } from "hardhat";

export enum TestAccounts {
  AccountA,
  AccountB,
  AccountC,
  AccountD,
}

export enum DomainKind {
  PureDomain,
  BeaconDomain,
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
  fromController?: boolean;
}

export const mintSenario: MintDomainConfig[] = [
  // domain tree of `wilder` root
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
    parentId:
      "0x196c0a1e30004b9998c97b363e44f1f4e97497e59d52ad151208e9393d70bb3b", // wilder
    label: "concept",
    name: "wilder.concept",
    metadataUri: "ipfs://QmSQTLzzsPS67ay4SFKMv9Dq57iSQ7pLWQVUvS3XB5MowK/110",
    sendToUser: TestAccounts.AccountB,
    domainKind: DomainKind.BeaconDomain,
  },
  {
    "tx.origin": TestAccounts.AccountC,
    id: "0x577547c6712ef7f054d8d593d46fa708f6cd8c455c707d779a08870d09f52ef5",
    parentId:
      "0x2c8c7428bc02f30bce3c83a7e781e6e622a3ff37ba4161179bd63b9554799cc8", // wilder.concept
    label: "environment",
    name: "wilder.concept.environment",
    metadataUri: "ipfs://QmSQTLzzsPS67ay4SFKMv9Dq57iSQ7pLWQVUvS3XB5MowK/111",
    sendToUser: TestAccounts.AccountC,
    domainKind: DomainKind.BeaconDomain,
  },
  {
    "tx.origin": TestAccounts.AccountD,
    id: "0x938ec331d6a5759665924e8536b43f2a563d3d230cc609d926bcc680de33d7fd",
    parentId:
      "0x577547c6712ef7f054d8d593d46fa708f6cd8c455c707d779a08870d09f52ef5", // wilder.concept.environment
    label: "metaroad",
    name: "wilder.concept.environment.metaroad",
    metadataUri: "ipfs://QmSQTLzzsPS67ay4SFKMv9Dq57iSQ7pLWQVUvS3XB5MowK/114",
    sendToUser: TestAccounts.AccountD,
    domainKind: DomainKind.PureDomain,
  },
  {
    "tx.origin": TestAccounts.AccountD,
    id: "0x5cbdddde02450ebaff467053c64e5821efc3aacbe9bdf6d3033c3f22ccdcbd7b",
    parentId:
      "0x577547c6712ef7f054d8d593d46fa708f6cd8c455c707d779a08870d09f52ef5", // wilder.concept.environment
    label: "wildstreets",
    name: "wilder.concept.environment.wildstreets",
    metadataUri: "ipfs://QmSQTLzzsPS67ay4SFKMv9Dq57iSQ7pLWQVUvS3XB5MowK/115",
    sendToUser: TestAccounts.AccountD,
    domainKind: DomainKind.PureDomain,
  },
  {
    "tx.origin": TestAccounts.AccountD,
    id: "0xd36b0c70f4b8c0c7693035df5d0f34921c33708a930cb410c72d05b5502f1bb4",
    parentId:
      "0x577547c6712ef7f054d8d593d46fa708f6cd8c455c707d779a08870d09f52ef5", // wilder.concept.environment
    label: "wildcity",
    name: "wilder.concept.environment.wildcity",
    metadataUri: "ipfs://QmSQTLzzsPS67ay4SFKMv9Dq57iSQ7pLWQVUvS3XB5MowK/116",
    sendToUser: TestAccounts.AccountD,
    domainKind: DomainKind.PureDomain,
  },
  // domain tree of `degen` root
  {
    "tx.origin": TestAccounts.AccountA,
    id: "0x956c1ec74b03071bf0d1cc37111b273fea8891f21e35345e71f43fccf8763059",
    parentId: ethers.constants.HashZero,
    label: "degen",
    name: "degen",
    metadataUri: "ipfs://Qmbc8XR1BrxRFGLv7DnaGiTc4RnNYdgHB3K9JTzT8kQmSR",
    sendToUser: TestAccounts.AccountA,
    domainKind: DomainKind.BeaconDomain,
  },
  {
    "tx.origin": TestAccounts.AccountB,
    id: "0x8642ecf82f8eb43eafa3c0daed22126f73e19c070b415f93e35480e971b46464",
    parentId:
      "0x956c1ec74b03071bf0d1cc37111b273fea8891f21e35345e71f43fccf8763059", // degen
    label: "kicks",
    name: "degen.kicks",
    metadataUri: "ipfs://QmSQTLzzsPS67ay4SFKMv9Dq57iSQ7pLWQVUvS3XB5MowK/5",
    sendToUser: TestAccounts.AccountB,
    domainKind: DomainKind.BeaconDomain,
  },
  {
    "tx.origin": TestAccounts.AccountC,
    id: "0x614ed70c2b84be23ec1e02c189b7ce8160d28742f6af45d8ca9c7eabc9f230e9",
    parentId:
      "0x8642ecf82f8eb43eafa3c0daed22126f73e19c070b415f93e35480e971b46464", // degen.kicks
    label: "airwild",
    name: "degen.kicks.airwild",
    metadataUri: "ipfs://QmSQTLzzsPS67ay4SFKMv9Dq57iSQ7pLWQVUvS3XB5MowK/6",
    sendToUser: TestAccounts.AccountC,
    domainKind: DomainKind.BeaconDomain,
  },
  {
    "tx.origin": TestAccounts.AccountD,
    id: "0xbed07defb324faedd8e65149843e73a565a0930cee0734c4162277013c25cfb1",
    parentId:
      "0x614ed70c2b84be23ec1e02c189b7ce8160d28742f6af45d8ca9c7eabc9f230e9", // degen.kicks.airwild
    label: "season0",
    name: "degen.kicks.airwild.season0",
    metadataUri: "ipfs://QmSQTLzzsPS67ay4SFKMv9Dq57iSQ7pLWQVUvS3XB5MowK/7",
    sendToUser: TestAccounts.AccountD,
    domainKind: DomainKind.PureDomain,
  },
  {
    "tx.origin": TestAccounts.AccountD,
    id: "0xb4d79eb3668ff95dd736a61559124df443280d2528c7d7512091aed95c2c3415",
    parentId:
      "0x614ed70c2b84be23ec1e02c189b7ce8160d28742f6af45d8ca9c7eabc9f230e9", // degen.kicks.airwild
    label: "season1",
    name: "degen.kicks.airwild.season1",
    metadataUri: "ipfs://QmdUzKo3CgnpgPtvbX6waGk31zQQwoM3SuYjaXk7F1b5FU",
    sendToUser: TestAccounts.AccountD,
    domainKind: DomainKind.PureDomain,
  },
  {
    "tx.origin": TestAccounts.AccountD,
    id: "0x60eaf4cf373d8983642ab80055a939710dea68300261ea15122f3a0c177109ad",
    parentId:
      "0x614ed70c2b84be23ec1e02c189b7ce8160d28742f6af45d8ca9c7eabc9f230e9", // degen.kicks.airwild
    label: "season2",
    name: "degen.kicks.airwild.season2",
    metadataUri: "ipfs://Qmbre1QprMHmGsBfpjv4k9gxV9rqqxwxj58CQJW6VEsWRq",
    sendToUser: TestAccounts.AccountD,
    domainKind: DomainKind.PureDomain,
  },
  // create domain tree by controller contract
  // {
  //   "tx.origin": TestAccounts.AccountB,
  //   id: "0x45483a3a19b4ce3eb27a6d8e0b4d1eb6561c94af65b268fc1038d45130e65796",
  //   parentId:
  //     "0x196c0a1e30004b9998c97b363e44f1f4e97497e59d52ad151208e9393d70bb3b", // wilder
  //   label: "moto",
  //   name: "wilder.moto",
  //   metadataUri: "ipfs://QmV5xYFYuv3ArP9wZSTkPfFxYA6ppiMP29VzfwKR1duyqh",
  //   sendToUser: TestAccounts.AccountB,
  //   domainKind: DomainKind.PureDomain,
  //   fromController: true,
  // },
  // {
  //   "tx.origin": TestAccounts.AccountC,
  //   id: "0xf972951da6996be9d4fb0a5c7bcbc229c82eb1270af32f05a4fbc57b7d16e3b9",
  //   parentId:
  //     "0x45483a3a19b4ce3eb27a6d8e0b4d1eb6561c94af65b268fc1038d45130e65796", // wilder.moto
  //   label: "genesis",
  //   name: "wilder.moto.genesis",
  //   metadataUri: "ipfs://QmenxXLj2bp1f254xrdoi5dWtdEKjc8bRtUbrGKhdC3KuB",
  //   sendToUser: TestAccounts.AccountC,
  //   domainKind: DomainKind.BeaconDomain,
  //   fromController: true,
  // },
  // {
  //   "tx.origin": TestAccounts.AccountD,
  //   id: "0xb7b4bf6561cb4ea62fdc16a97fca02fb0f4b665c63e4a0be021c6603ad709925",
  //   parentId:
  //     "0xf972951da6996be9d4fb0a5c7bcbc229c82eb1270af32f05a4fbc57b7d16e3b9", // wilder.moto.genesis
  //   label: "0",
  //   name: "wilder.moto.genesis.0",
  //   metadataUri: "ipfs://QmTkYtCdrYqQWxEQ3q8nDqzsDG7LFrEwR4xxzwYP9fqPW5/0",
  //   sendToUser: TestAccounts.AccountD,
  //   domainKind: DomainKind.PureDomain,
  //   fromController: true,
  // },
  // {
  //   "tx.origin": TestAccounts.AccountD,
  //   id: "0x1bd6eaadff01aa34d93f56479719dfa28017bf3f7fcea8b6c5c740415f1d3b35",
  //   parentId:
  //     "0xf972951da6996be9d4fb0a5c7bcbc229c82eb1270af32f05a4fbc57b7d16e3b9", // wilder.moto.genesis
  //   label: "1",
  //   name: "wilder.moto.genesis.1",
  //   metadataUri: "ipfs://QmTkYtCdrYqQWxEQ3q8nDqzsDG7LFrEwR4xxzwYP9fqPW5/1",
  //   sendToUser: TestAccounts.AccountD,
  //   domainKind: DomainKind.PureDomain,
  //   fromController: true,
  // },
  // {
  //   "tx.origin": TestAccounts.AccountD,
  //   id: "0x2101b3784895b46a382c2185634acfb8bd0526fb0098170a7f76f6b2037e5223",
  //   parentId:
  //     "0xf972951da6996be9d4fb0a5c7bcbc229c82eb1270af32f05a4fbc57b7d16e3b9", // wilder.moto.genesis
  //   label: "2",
  //   name: "wilder.moto.genesis.2",
  //   metadataUri: "ipfs://QmTkYtCdrYqQWxEQ3q8nDqzsDG7LFrEwR4xxzwYP9fqPW5/2",
  //   sendToUser: TestAccounts.AccountD,
  //   domainKind: DomainKind.PureDomain,
  //   fromController: true,
  // },
  {
    "tx.origin": TestAccounts.AccountB,
    id: "0xa8bb95e9d1120c8a5f44c7a0507d9656bdd6c0def01fab9fc8f510124fe28ecd",
    parentId:
      "0x196c0a1e30004b9998c97b363e44f1f4e97497e59d52ad151208e9393d70bb3b", // wilder
    label: "cribs",
    name: "wilder.cribs",
    metadataUri: "https://ipfs.fleek.co/ipfs/Qme71pAG25BgkQ3vnwQUyan53KRR76Yw8b6nL3oJK7uh9f",
    sendToUser: TestAccounts.AccountB,
    domainKind: DomainKind.BeaconDomain,
    fromController: true,
  },
  {
    "tx.origin": TestAccounts.AccountC,
    id: "0xbc63dea9c0fa8a73ceceb71785942f67a085089cf051cc02e0d11621f631cee7",
    parentId:
      "0xa8bb95e9d1120c8a5f44c7a0507d9656bdd6c0def01fab9fc8f510124fe28ecd", // wilder.cribs
    label: "wiami",
    name: "wilder.cribs.wiami",
    metadataUri: "https://ipfs.fleek.co/ipfs/QmTSaxuYQerBB6Un68Bv7WRAyXu3PEezyRVqja7rbVjgZG",
    sendToUser: TestAccounts.AccountC,
    domainKind: DomainKind.BeaconDomain,
    fromController: true,
  },
  {
    "tx.origin": TestAccounts.AccountD,
    id: "0xdc01aa3499efc1a8466be4c3355196bec6f3ccd4a190af99126999842546a523",
    parentId:
      "0xbc63dea9c0fa8a73ceceb71785942f67a085089cf051cc02e0d11621f631cee7", // wilder.cribs.wiami
    label: "37-106",
    name: "wilder.cribs.wiami.37-106",
    metadataUri: "ipfs://QmbHTqzJphNYNqefvmXL3K4xndy1KUiiDQkWzbAMuEaETn",
    sendToUser: TestAccounts.AccountD,
    domainKind: DomainKind.PureDomain,
    fromController: true,
  },
  {
    "tx.origin": TestAccounts.AccountD,
    id: "0xe9c65e21b45650fe1820abc677537b2d9a59c9f2e618935bf288fa9b25b4719b",
    parentId:
      "0xbc63dea9c0fa8a73ceceb71785942f67a085089cf051cc02e0d11621f631cee7", // wilder.cribs.wiami
    label: "13-39",
    name: "wilder.cribs.wiami.13-39",
    metadataUri: "ipfs://QmRo3hfrqH7zAJfhX365kUCCAgNVx9H8KK3gd4zHduz2TS",
    sendToUser: TestAccounts.AccountD,
    domainKind: DomainKind.PureDomain,
    fromController: true,
  },
  {
    "tx.origin": TestAccounts.AccountD,
    id: "0x79eabdb65f533db8ac3a829cab6b7ae766a1e2e7691f061ec5ebf41978de5ada",
    parentId:
      "0xbc63dea9c0fa8a73ceceb71785942f67a085089cf051cc02e0d11621f631cee7", // wilder.cribs.wiami
    label: "30-88",
    name: "wilder.cribs.wiami.30-88",
    metadataUri: "ipfs://QmczPLbcPDKNeYBb24idxeGWiFqFp7vwd7Yj3TtLT5jhNf",
    sendToUser: TestAccounts.AccountD,
    domainKind: DomainKind.PureDomain,
    fromController: true,
  },
];
