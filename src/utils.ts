import { Signer } from "ethers";

const BancorRegistry = {
  rinkeby: "0xA6DB4B0963C37Bc959CbC0a874B5bDDf2250f26F",
  mainnet: "0x52Ae12ABe5D8BD778BD5397F99cA900624CfADD4",
};

async function getAccounts(signers: Signer[]) {
  const accs: string[] = [];
  for (const account of signers) {
    accs.push(await account.getAddress());
  }
  return accs;
}

export { getAccounts };
