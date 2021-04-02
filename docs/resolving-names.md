# Resolving ZNS Names

Modeled after [EIP-137](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-137.md)

## namehash algorithm

Before being used in ZNS, names are hashed using the 'namehash' algorithm.
This algorithm recursively hashes components of the name, producing a unique, fixed-length string for any valid input domain.
The output of namehash is referred to as a 'node'.

Pseudocode for the namehash algorithm is as follows:

```py
def namehash(name):
  if name == '':
    return '\0' * 32
  else:
    label, _, remainder = name.partition('.')
    return sha3(sha3(label) + namehash(remainder))
```

The difference between ENS and ZNS is name hashing is done from left->right not right->left.


## Domain Id's, labels, hashes

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
let hash0 = hash(<32 zeros>);
let hash1 = hash('dorg');
let hash2 = hash('members');
let hash3 = hash('zachary');

// hash of dorg.members.zachary
let domainId = hash(hash(hash(hash0 + hash1) + hash2) + hash3);
```

#### Why this matters

This if we had a graphql schema representing our domain:

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
  - `hash(hash(hash(hash(<32 zeros>, 'dorg') + hash('members')) + hash('zachary'))`
- The `name` would be the plaintext complete domain name
  - `'dorg.members.zachary'`
- The `labelName` would be the plaintext subdomain label
  - `'zachary'`
- The `labelHash` would be the hash of the subdomain label
  - `hash('zachary')`

```gql
type Domain {
  id: ID!           
  name: String      // 'dorg.members.zachary'
  labelName: String // 'zachary'
  labelHash: Bytes  // hash('zachary')
}
```
