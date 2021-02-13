// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity >=0.4.24 <0.8.0;
import "./IERC20Token.sol";
import "../../converter/interfaces/IConverterAnchor.sol";
import "../../utility/interfaces/IOwned.sol";

/*
    DSToken interface
*/
interface IDSToken is IConverterAnchor, IERC20Token {
    function issue(address _to, uint256 _amount) external;

    function destroy(address _from, uint256 _amount) external;
}
