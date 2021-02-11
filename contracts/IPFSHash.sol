pragma solidity ^0.7.6;

/// @title verifyIPFS
/// @author Martin Lundfall (martin.lundfall@consensys.net)
/// @author updated by xiphiness (xiphiness@protonmail.com)
library verifyIPFS {
    //  <cidv1> ::= <multibase-prefix><multicodec-cidv1><multicodec-content-type><multihash-content-address>
    // 01 - cidv1
    // 55 - raw
    // 1220 - sha2-256
    bytes constant prefix = hex"01551220";
    bytes constant ALPHABET = "abcdefghijklmnopqrstuvwxyz234567";

    /// @dev generates the corresponding IPFS hash (in base 32) to the given string using sha2-256 and cidv1
    /// @param contentString The content of the IPFS object
    /// @return The IPFS hash in base 32
    function generateHash(string memory contentString)
        internal
        view
        returns (string memory)
    {
        bytes memory content = bytes(contentString);
        return
            string(
                rfc4648_encode(
                    abi.encodePacked(prefix, sha256(content)),
                    5,
                    ALPHABET,
                    "b"
                )
            );
    }

    /// @dev Compares an IPFS hash with content
    function verifyHash(string memory contentString, string memory hash)
        internal
        view
        returns (bool)
    {
        return equal(bytes(generateHash(contentString)), bytes(hash));
    }

    function rfc4648_encode(
        bytes memory data,
        uint256 bitsPerChar,
        bytes memory alpha,
        bytes1 _prefix
    ) internal view returns (bytes memory) {
        uint256 totalbits = data.length * 8;
        uint256 totalchars =
            totalbits / bitsPerChar + ((totalbits % bitsPerChar) == 0 ? 1 : 2); // +1 here for prefix
        bytes memory out = new bytes(totalchars);
        // bool pad = alpha[alpha.length - 1] == '=';
        uint256 mask = (1 << bitsPerChar) - 1;
        uint256 bits = 0;
        uint256 carry = 0;
        out[0] = _prefix;
        uint256 outIndex = 1;
        for (uint256 i = 0; i < data.length; i++) {
            carry = (carry << 8) | uint8(data[i]);
            bits += 8;
            while (bits > bitsPerChar) {
                bits -= bitsPerChar;
                out[outIndex] = alpha[mask & (carry >> bits)];
                outIndex++;
            }
        }
        if (bits > 0) {
            out[outIndex] = alpha[mask & (carry << (bitsPerChar - bits))];
        }
        //   if (pad) {
        //     while ((out.length * bitsPerChar) & 7) {
        //       out += '='
        //     }
        //   }
        return out;
    }

    function toBytes(bytes32 input) internal pure returns (bytes memory) {
        bytes memory output = new bytes(32);
        for (uint8 i = 0; i < 32; i++) {
            output[i] = input[i];
        }
        return output;
    }

    function equal(bytes memory one, bytes memory two)
        internal
        pure
        returns (bool)
    {
        if (!(one.length == two.length)) {
            return false;
        }
        for (uint256 i = 0; i < one.length; i++) {
            if (!(one[i] == two[i])) {
                return false;
            }
        }
        return true;
    }

    function concat(bytes memory byteArray, bytes memory byteArray2)
        internal
        pure
        returns (bytes memory)
    {
        bytes memory returnArray =
            new bytes(byteArray.length + byteArray2.length);
        uint16 i = 0;
        for (; i < byteArray.length; i++) {
            returnArray[i] = byteArray[i];
        }
        for (; i < (byteArray.length + byteArray2.length); i++) {
            returnArray[i] = byteArray2[i - byteArray.length];
        }
        return returnArray;
    }
}
