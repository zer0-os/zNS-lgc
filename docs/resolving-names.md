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