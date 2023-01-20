export interface AccountsCollectionDto {
  accounts: Account[];
}

export interface AccountDto {
  account: Account;
}

export interface Domain {
  id: string,
  name: string,
  label: string,
  metadata: string
}

export interface DomainHolder {
  address: string,
  ownedDomains: Domain[]
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