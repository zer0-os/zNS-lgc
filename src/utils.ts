import { Signer } from "ethers";

async function getAccounts(signers: Signer[]) {
  const accs: string[] = [];
  for (const account of signers) {
    accs.push(await account.getAddress());
  }
  return accs;
}

export { getAccounts }
