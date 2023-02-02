
import fetch from "cross-fetch";
import { Domain, RequestParams } from "./types";
import { getLogger } from "../../utilities";

export * from "./types"

export const getDomains = async () => {
  const baseUri = process.env.DATASTORE_URI;

  if (!baseUri) {
    throw Error("Must set `DATASTORE_URI` in a local .env file");
  }

  const domains: Domain[] = await getDomainsLoop(baseUri, {
    skip: 0,
    limit: 1000,
    sortDirection: -1
  });
  return domains;
}

/**
 * Get a list of all domains from the datastore 
 * @param baseUri The base datastore URI to hit
 * @param params Request parameters such as skip, limit, and sortDirection
 * @returns The total list of domains
 */
export const getDomainsLoop = async (baseUri: string, params: RequestParams): Promise<Domain[]> => {
  const logger = getLogger("snapshot::datastore");

  const results: Domain[] = [];
  let accounts: Map<string, boolean> = new Map();

  while (true) {
    logger.log(`Requesting with skip of ${params.skip}`)
    const requestUri = `${baseUri}v1/domains/list?skip=${params.skip}&limit=${params.limit}&sortDirection=${params.sortDirection}`;
    const res: Response = await fetch(requestUri);

    const data: { results: Domain[] } = await res.json();

    for (const domain of data.results) {
      if (accounts.has(domain.owner)) continue;
      if (accounts.has(domain.owner.toLowerCase())) {
        logger.log(`lower case bug found for ${domain.owner}`)
      }
      accounts.set(domain.owner, true); // lower case? compare against subgraph directly?
    }

    if (data.results.length === 0) {
      logger.log(`Total domains found: ${results.length}`);
      logger.log(`Total accounts found: ${accounts.size}`);
      return results;
    }
    results.push(...data.results);
    params.skip! += 1000;
  }
}