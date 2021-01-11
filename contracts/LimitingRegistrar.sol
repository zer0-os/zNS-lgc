pragma solidity ^0.7.6;
pragma experimental ABIEncoderV2;
// ABIEncoderV2 only used for view functions

/**
 * @title LimitingController
 * @dev Create and interact with Registries.
 */

import "./IRegistrar.sol";
import "./IRegistry.sol";

contract LimitingRegistrar {

    struct DStore {
        address owner;
        mapping(uint256 => address) entries; // mapping to subsequent controller
        uint[] layerLimits;
        IRegistry registry;
    }

    function dStore() internal view returns (DStore storage dStore) {
        bytes32 slot = keccak256("zns.LimitingRegistrar");
        assembly {dStore.slot := slot}
    }

    // constructor(address _owner, address _registrar) public {
    //     registrar = _registrar;
    // }

    function setLimits(uint256[] calldata limits) public {
        DStore storage dstore = dStore();
        // layerLimits.length = limits;
        delete dstore.layerLimits;
        for (uint i = 0; i < limits.length; i++) {
            dstore.layerLimits.push(limits[i]);
        }
    }

    function __limitingRegister_canCreate(
        uint256 parentId,
        uint256 tokenId,
        address _controller,
        address _owner
    ) internal view returns (bool) {
        DStore storage dstore = dStore();
        uint256 depth = dstore.registry.getDepth(parentId);
        uint256 limit = dstore.layerLimits[depth];
        if (limit == 0) {
            // careful, this assumes all zero limits are infinite - the opposite!
            // what solidity makes us do to minimize computation and data
            return true;
        }
        IRegistrar subcontroller = IRegistrar(dstore.entries[parentId]);
        return
            (_controller == address(this)) &&
            (dstore.registry.getChildLength(tokenId) <= depth) &&
            (address(subcontroller) == address(0) ||
                subcontroller.canCreate(tokenId, _controller, _owner));
    }
}
