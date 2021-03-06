# Data Schemas

Subnode data schemas that will be populated

Domain
```gql
type Domain {
  id: ID!
  name: String
  labelName: String
  labelHash: Bytes
  parent: Domain
  subdomains: [Domain]!
  owner: ID!
  creator: ID!
  events: [DomainEvent!]!
}
```

DomainEvents
```gql
interface DomainEvent {
  id: ID!
  domain: Domain!
  blockNumber: Int!
  transactionId: Bytes!
}

type Transfer implements DomainEvent {
  id: ID!
  domain: Domain!
  blockNumber: Int!
  transactionID: bytes!
  owner: Account!
}

type NewOwner implements DomainEvent {
  id: ID!
  domain: Domain!
  blockNumber: Int!
  transactionID: bytes!
  owner: Account!
}
```