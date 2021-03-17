# v1 Integration

This folder contains the solidity source and interface ABI's for the *v1* version of the ZNS contracts.

It should be presumed that these contracts may change in shape over time.

## Changes to take note of:

Take a look at v0 to know changes from v0.

In v1, there are new events:

```sol
// Emitted whenever the metadata of a domain is locked
event MetadataLocked(uint256 indexed id, address locker);

// Emitted whenever the metadata of a domain is unlocked
event MetadataUnlocked(uint256 indexed id);

// Emitted whenever the metadata of a domain is changed
event MetadataChanged(uint256 indexed id, string uri);

// Emitted whenever the royalty amount is changed
event RoyaltiesAmountChanged(uint256 indexed id, uint256 amount);
```

and the `DomainCreated` event has changed:

```
  event DomainCreated(
    uint256 indexed id,
    string name,
    uint256 indexed nameHash,
    uint256 indexed parent,
    address creator,
    address controller
  );
```

Take note of the two additional addresses at the end, creator and controller.

There are also a handful of new view functions.

## Other Notes:

There are some architectural decisions which should be understood:

### Domain Id's, labels, hashes

A domain is reference by an `id`.

The `domain id` can be directly calculated from a `domain name`.

A `domain name` is the full domain path, for instance `dorg.members.zachary`.

A `domain name` is made up of labels, where for a domain of `dorg.members.zachary` would have 3 labels:

- dorg
- members
- zachary

Where `members` is the sub domain label of `dorg`, and `zachary` is the sub domain label of `members`.

To calculate a domain's id you must use an algorithm as such:

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
You would find that the id of `dorg.members.zachary` to be:
```js
let hash1 = hash('dorg');
let hash2 = hash('members');
let hash3 = hash('zachary');

// hash of dorg.members.zachary
let domainId = hash(hash(hash1 + hash2) + hash3);
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

- The `id` is the complete domain id
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
