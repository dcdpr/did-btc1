## Appendix

### Bech32m Encoding and Decoding

**did:btc1** uses the Bech32m algorithm to encode and decode several data values.
The original Bech32 algorithm is documented in
[BIP-0173](https://github.com/bitcoin/bips/blob/master/bip-0173.mediawiki). The updated algorithm, Bech32m, is documented in
[BIP-0350](https://github.com/bitcoin/bips/blob/master/bip-0350.mediawiki).

#### Bech32m Encoding

Given:

* `hrp` - required, a string representing the Human-Readable Part of the encoding
* `dataBytes` - required, a byte array to be encoded

1. Initialize `encodedString` to the output of Bech32m encoding the `hrp` and
   the `dataBytes` as described in
   [BIP-0350](https://github.com/bitcoin/bips/blob/master/bip-0350.mediawiki).
1. Return `encodedString`.

#### Bech32m Decoding

Given:

* `encodedString` - required, the Bech32m-encoded string from a prior encoding
  operation

1. Initialize `hrp` and `dataBytes` to the result of Bech32m decoding the
   `encodedString` as described in
   [BIP-0350](https://github.com/bitcoin/bips/blob/master/bip-0350.mediawiki).
1. Return `hrp` and `dataBytes`.

### JSON Canonicalization and Hash

A macro function that takes in a JSON document, `document`, and canonicalizes it
following the [JSON Canonicalization Scheme](https://www.rfc-editor.org/rfc/rfc8785).
The function returns the `canonicalizedBytes`.

1. Set `canonicalBytes` to the result of applying the JSON Canonicalization Scheme
   to the `document`.
1. Set `hashBytes` to the result of applying the SHA256 cryptographic hashing
   algorithm to the `canonicalBytes`.
1. Return `hashBytes`.

### Fetch Content from Addressable Storage

A macro function that takes in SHA256 hash of some content, `hashBytes`, converts these 
bytes to a IPFS v1 ::Content Identifier:: and attempts to retrieve the identified content 
from ::Content Addressable Storage:: (CAS). 

The function returns the retrieved `content` or null.

1. Set `cid` to the result of converting `hashBytes` to an IPFS v1 ::CID::.
1. Set `content` to the result of fetching the `cid` from a ::CAS:: system. Which ::CAS:: systems 
   checked is left to the implementation. TODO: Is this right? Are implementations just supposed to check all CAS they trust?
1. If content for `cid` cannot be found, set `content` to null.
1. Return `content`