# Resolving ZNS Names

Modeled after [EIP-137](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-137.md)

## namehash algorithm

Before being used in ZNS, names are hashed using the 'namehash' algorithm.
This algorithm recursively hashes components of the name, producing a unique, fixed-length string for any valid input domain.
The output of namehash is referred to as a 'node'.

Pseudocode for the namehash algorithm is as follows:

```
def namehash(name):
  if name == '':
    return '\0' * 32
  else:
    label, _, remainder = name.partition('.')
    return sha3(namehash(remainder) + sha3(label))
```

Informally, the name is split into labels, each label is hashed.
Then, starting with the last component, the previous output is concatenated with the label hash and hashed again.
The first component is concatenated with 32 '0' bytes.
Thus, 'mysite.swarm' is processed as follows:

```
node = '\0' * 32
node = sha3(node + sha3('swarm'))
node = sha3(node + sha3('mysite'))
```

Implementations should conform to the following test vectors for namehash:

```
namehash('') = 0x0000000000000000000000000000000000000000000000000000000000000000
namehash('eth') = 0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae
namehash('foo.eth') = 0xde9b09fd7c5f901e23a3f19fecc54828e9c848539801e86591bd9801b019f84f
```
