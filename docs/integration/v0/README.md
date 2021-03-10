# v1 Integration

This folder contains the solidity source and interface ABI's for the *v1* version of the ZNS contracts.

It should be presumed that these contracts may change in shape over time.

## Changes to take note of:

The ZNS Core (Registry) has been combined inside of the Registrar.
This means there are only two contracts to integrate with

## Contracts

There are two contracts:

### Registrar

The Registrar is responsible for:

- Domain Management
- Domain NFT's
- Delegation of domain control (controllers)
- Domain Metadata locking

[Source](./RegistrarV0Reference.sol)  
[ABI](./RegistrarV0Reference.json)

### Controller

The controller is responsible for

- Allowing an end-user to create subdomains on a domain they own

[Source](./ControllerV0Reference.sol)  
[ABI](./ControllerV0Reference.json)

## Subgraph Schema

We believe that this will be the current layout of the subgraph.

### Domain

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

### DomainEvents

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

## Other Notes:

There are some architectural decisions which should be understood:

### Domain Id's, labels, hashes

A domain is reference by an `id`.

A `domain id` is the same as a `domain hash`.

The `domain hash` can be directly calculated from a `domain name`.

A `domain name` is the full domain path, for instance `dorg.members.zachary`.

A `domain name` is made up of labels, where for a domain of `dorg.members.zachary` would have 3 labels:

- dorg
- members
- zachary

Where `members` is the sub domain label of `dorg`, and `zachary` is the sub domain label of `members`.

To calculate a domain's hash you must use an algorithm as such:

```js
// This is psuedo-code

function hash(x) {
  return keccak256(x)
}

function hashDomain(name) {
  if (name === '') {
    return '\0' * 32; // 32 zero's
  }

  const slices = name.split('.', 1); // split the string into 2, based on the first '.'

  const parentDomain = slices[0];
  const subDomains = slices[1];

  return hash(hash(slices[0]) + hashDomain(subDomains));
}

```

Thus if you consider the domain name `dorg.members.zachary` and each element of the domain name delineated by a `'.'` to be a label (`dorg`, `members` `zachary`).
You would find that the hash of `dorg.members.zachary` to be:
```js
let hash1 = hash('dorg');
let hash2 = hash('members');
let hash3 = hash('zachary');

// hash of dorg.members.zachary
let domainHash = hash(hash(hash1 + hash2) + hash3);
let domainId = domainHash;
```

#### Why this matters

In the graphQL schema you will see this snippet:

```gql
type Domain {
  id: ID!
  name: String
  labelName: String
  labelHash: Bytes
}
```

It's important to understand how the hashing works to understand the relation between these fields:

Given a domain `dorg.members.zachary`

The corresponding `Domain` graphql object's fields would be:

- The `id` is the complete domain hash
  - `hash(hash(hash('dorg') + hash('members')) + hash('zachary'))`
- The `name` would be the plaintext complete domain name
  - `'dorg.members.zachary'`
- The `labelName` would be the plaintext subdomain label
  - `'zachary'`
- The `labelHash` would be the hash of the subdomain label
  - `hash('zachary')`

```gql
type Domain {
  id: ID!           // hash(hash(hash('dorg') + hash('members')) + hash('zachary'))
  name: String      // 'dorg.members.zachary'
  labelName: String // 'zachary'
  labelHash: Bytes  // hash('zachary')
}
```
