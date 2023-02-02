import { ApolloClient, NormalizedCacheObject } from "@apollo/client/core";
import { getAllDomainOwners, getSpecificDomainOwner } from "./queries";
import { AccountDto, AccountsCollectionDto, Domain, DomainOwner } from "./types";
import { getLogger } from "../../utilities";
import { createClient, performQuery } from "../helpers";

export * from "./types";

/**
 * Get the list of all domain owners and their owned domains from zNS Subgraph
 * 
 * @param connectedClient An Apollo subgraph client connected to the zNS Subgraph
 * @returns A DomainHolder array that contains a list of all domain holders and their owned domains
 */
export const getDomainOwners = async (): Promise<DomainOwner[]> => {
  const logger = getLogger("snapshot::subgraph");
  // Array to build up and collect the data
  const allDomainHolders: DomainOwner[] = [];

  const subgraphUri = process.env.SUBGRAPH_URI;
  if (!subgraphUri) {
    throw Error("Subgraph URI not found. Be sure to set it in your '.env' file as 'SUBGRAPH_URI='");
  }
  const client: ApolloClient<NormalizedCacheObject> = createClient(subgraphUri);

  let skip = 0;
  let accounts = 0;
  let domains = 0;

  while (skip < 5001) {
    const params = {
      first: 1000,
      skip: skip
    }
    const collection = await performQuery<AccountsCollectionDto>(client, getAllDomainOwners, params);

    // If no accounts are found we're finished looping
    if (collection.accounts.length === 0) break;

    for (const account of collection.accounts) {
      // Skip this account if not currently holding
      if (account.ownedDomains.length === 0) continue;
      accounts++;

      const ownedDomains: Domain[] = [];

      if (account.ownedDomains.length === 1000) {
        // If account holds 1000 domains they may actually hold more, but it is limited in the query to 1000
        // We loop with a secondary query in this case
        logger.log(`Looks like ${account.id} is a 🐳🐳🐳`);
        const holder = await getDomainOwner(client, account.id)
        domains += holder.ownedDomains.length;
        allDomainHolders.push(holder);
        continue;
      } else {
        for (const domain of account.ownedDomains) {
          domains++;
          ownedDomains.push({
            id: domain.id,
            name: domain.name,
            label: domain.label,
            metadata: domain.metadata
          });
        }
      }
      allDomainHolders.push({
        address: account.id,
        ownedDomains: ownedDomains
      });
    }

    // Increment skip 1000 records at a time
    skip += 1000;
    logger.log(`Requesting with skip: ${skip}`);
  }

  logger.log(`Total accounts found: ${accounts}`);
  logger.log(`Total domains found:  ${domains}`);

  return allDomainHolders
}

/**
 * Get a singular domain holder and all their domains.
 * Used when aggregating all domain holders and one is found with more than 1000 domains.
 * 
 * @param connectedClient The Apollo client connected to the subgraph
 * @param address The address of the user to find
 * @returns The user and their domains formatted as a DomainHolder
 */
export const getDomainOwner = async (
  connectedClient: ApolloClient<NormalizedCacheObject>,
  address: string,
): Promise<DomainOwner> => {
  let skip = 0;

  const ownedDomains: Domain[] = [];

  while (skip < 5001) {
    const params = {
      first: 1000,
      skip: skip,
      id: address
    }
    const accountDto = await performQuery<AccountDto>(connectedClient, getSpecificDomainOwner, params);

    // Query to singular `account` entity returns a data object with`account` property
    const account = accountDto.account;
    if (account.ownedDomains.length === 0) {
      break;
    }

    for (const domain of account.ownedDomains) {
      ownedDomains.push({
        id: domain.id,
        name: domain.name,
        label: domain.label,
        metadata: domain.metadata
      });
    }
    skip += 1000;
  }
  const holder: DomainOwner = {
    address: address,
    ownedDomains: ownedDomains
  }
  return holder;
}
