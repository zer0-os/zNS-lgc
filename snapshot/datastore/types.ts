// API Request parameters
export interface RequestParams {
  skip?: number,
  limit?: number,
  sortDirection?: number
}

// Represent a DataStore domain
export interface Domain {
  domainId: string,
  isRoot: boolean
  isValid: boolean,
  registrar: string
  label: string
  name: string
  parent: string
  labelHash: string
  minter: string
  owner: string
  metadataUri: string
  royaltyAmount: string
  locked: boolean,
  lockedBy: string
  created: {
    timestamp: string
    blockNumber: number
    logIndex: number
  }
}
