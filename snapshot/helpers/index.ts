import {
  ApolloClient,
  NormalizedCacheObject,
  HttpLink,
  InMemoryCache,
  DocumentNode,
} from "@apollo/client/core";
import fetch from "cross-fetch";

import { getAllDomainOwners, getSpecificDomainOwner } from "../queries";
import { AccountDto, AccountsCollectionDto, Domain, DomainHolder } from "../types";

/**
 * Creates a subgraph client attached the provided URI
 * 
 * @param subgraphUri The subgraph to connect to
 * @returns The attached client for querying that graph
 */
export const createClient = (subgraphUri: string): ApolloClient<NormalizedCacheObject> => {
  const client = new ApolloClient({
    link: new HttpLink({ uri: subgraphUri, fetch }),
    cache: new InMemoryCache(),
  });
  return client;
}

/**
 * Get the list of all domain owners and their owned domains from zNS Subgraph
 * 
 * @param connectedClient An Apollo subgraph client connected to the zNS Subgraph
 * @returns A DomainHolder array that contains a list of all domain holders and their owned domains
 */
export const getDomainOwners = async (connectedClient: ApolloClient<NormalizedCacheObject>): Promise<DomainHolder[]> => {
  const allDomainHolders: DomainHolder[] = [];

  let skip = 0;
  let accounts = 0;
  let domains = 0;

  while (skip < 5001) {
    const params = {
      first: 1000,
      skip: skip
    }
    const collection = await performQuery<AccountsCollectionDto>(connectedClient, getAllDomainOwners, params);

    // If no accounts are found we're finished looping
    if (collection.accounts.length === 0) break;

    for (const account of collection.accounts) {
      accounts++;

      // Skip this account if not currently holding
      if (account.ownedDomains.length === 0) continue;

      const ownedDomains: Domain[] = [];

      if (account.ownedDomains.length === 1000) {
        // If account holds 1000 domains they may actually hold more, but it is limited in the query to 1000
        // We loop with a secondary query in this case
        console.log(`Looks like ${account.id} is a 🐳🐳🐳`);
        const holder = await getDomainOwner(connectedClient, account.id)
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
    if (skip % 1000 === 0) console.log(skip);
  }

  console.log(`Total accounts found:\t ${accounts}`);
  console.log(`Total domains found:\t ${domains}`);
  return allDomainHolders;
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
): Promise<DomainHolder> => {
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
  const holder: DomainHolder = {
    address: address,
    ownedDomains: ownedDomains
  }
  return holder;
}

/**
 * Execute the `query` on the subgraph that `client` is connected to with `params`
 * 
 * @param client The connected client
 * @param query The query to execute
 * @param params The parameters for the query
 * @returns The resulting data
 */
const performQuery = async <T>(client: ApolloClient<NormalizedCacheObject>, query: DocumentNode, params: any): Promise<T> => {
  const result = await client.query<T>(
    {
      query: query,
      variables: params
    }
  )
  if (result.error) {
    throw result.error;
  }

  return result.data as T;
}
