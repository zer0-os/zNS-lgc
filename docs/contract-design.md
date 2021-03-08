# Contract Design

## ZNS Registry Specification

The ZNS Registry exposes the following functions:

## Registry specification

The ZNS registry contract exposes the following functions:

```solidity
function owner() constant returns (address);
```

Returns the owner of the registry.

```solidity
function owner(bytes32 node) constant returns (address);
```

Returns the owner of the specified node.

```solidity
function setOwner(bytes32 node, address owner);
```

Transfers ownership of a node to another registrar.
This function may only be called by the current owner of `node`.
A successful call to this function logs the event `Transfer(bytes32 indexed, address)`.

```solidity
function setSubnodeOwner(bytes32 node, bytes32 label, address owner);
```

Creates a new node, `sha3(node, label)` and sets its owner to `owner`, or updates the node with a new owner if it already exists.
This function may only be called by the registry owner.
A successful call to this function logs the event `NewOwner(bytes32 indexed, bytes32 indexed, address)`.

