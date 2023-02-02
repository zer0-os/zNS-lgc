export interface AccountsCollectionDto {
  accounts: Account[];
}

// An account with 1000 domains may actually have more, that is
// just the technical limit of a subgraph request, so we must query
// for the individual account.
export interface AccountDto {
  account: Account;
}

// For collection from subgraph
export interface Domain {
  id: string,
  name: string,
  label: string,
  metadata: string
}

export interface DomainOwner {
  address: string,
  ownedDomains: Domain[]
}

export interface DomainHolderData {
  accounts: number;
  domains: number;
}

interface OwnedDomains {
  id: string;
  name: string;
  label: string;
  metadata: string;
}

interface Account {
  id: string;
  ownedDomains: OwnedDomains[]
}
