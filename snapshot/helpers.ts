import {
  ApolloClient,
  NormalizedCacheObject,
  HttpLink,
  InMemoryCache,
  DocumentNode,
} from "@apollo/client/core";
import fetch from "cross-fetch";

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
 * Execute the `query` on the subgraph that `client` is connected to with `params`
 * 
 * @param client The connected client
 * @param query The query to execute
 * @param params The parameters for the query
 * @returns The resulting data
 */
export const performQuery = async <T>(client: ApolloClient<NormalizedCacheObject>, query: DocumentNode, params: any): Promise<T> => {
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