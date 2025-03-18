## Appendix

### Bech32 Encoding and Decoding

**did:btc1** uses the Bech32 algorithm to encode and decode several data values.
The Bech32 algorithm is documented in
[BIP-0173](https://github.com/bitcoin/bips/blob/master/bip-0173.mediawiki).
Additionally, **did:btc1** uses an updated Bech32 algorithm known as "bech32m"
that is documented in
[BIP-0350](https://github.com/bitcoin/bips/blob/master/bip-0350.mediawiki).
For this specification we define two functions: `bech32-encode` and `bech32-decode`.

#### bech32-encode

This algorithm takes two REQUIRED inputs: a string, `hrp` which is the human-readable
part of the encoding and an array of bytes to be encoded called the `dataPart`.

1. Initialize `result` to the output of Bech32 encoding the `hrp` and the
   `dataPart` as described in
   [BIP-0173](https://github.com/bitcoin/bips/blob/master/bip-0173.mediawiki).
1. Return `result`.

#### bech32-decode

This algorithm takes one REQUIRED input: a string `bech32Str` representing a Bech32
encoding data value.

1. Initialize `hrp` and `dataPart` to the result of Bech32 decoding the `bech32Str`
   as described in
   [BIP-0173](https://github.com/bitcoin/bips/blob/master/bip-0173.mediawiki).
1. Return a tuple (`hrp`, `dataPart`).

#### Bech32 Encoding a secp256k1 Public Key

A macro or convenience function can be used to encode a `keyBytes` representing
a compressed SEC encoded secp256k1 public key. The algorithm takes one REQUIRED
input, `keyBytes`.

1. Initialize `hrp` to `"k"`.
1. Initialize `dataPart` to `keyBytes`.
1. Return the result of the [`bech32-encode`](#bech32-encode) algorithm,
   passing `hrp` and `dataPart`.

#### Bech32 Encoding a hash-value

A macro or convenience function can be used to encode a `hashBytes` representing
the sha256 hash of an initiating DID document. The algorithm takes one REQUIRED
input, `hashBytes`.

1. Initialize `hrp` to `"x"`.
1. Initialize `dataPart` to `hashBytes`.
1. Return the result of the [`bech32-encode`](#bech32-encode) algorithm,
   passing `hrp` and `dataPart`.

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

### Root did:btc1 Update Capabilities

Note: Not sure if these algorithms should go here or in the appendix?

#### Derive Root Capability from **did:btc1** Identifier

This algorithm deterministically generates a ZCAP-LD root capability from a
given **did:btc1** identifier. Each root capability is unique to the identifier.
This root capability is defined and understood by the **did:btc1** specification
as the root capability to authorize updates to the specific **did:btc1** identifiers
DID document.

The algorithm takes in a **did:btc1** identifier and returns a `rootCapability` object.

1. Define `rootCapability` as an empty object.
1. Set `rootCapability.@context` to 'https://w3id.org/zcap/v1'.
1. Set `encodedIdentifier` to result of calling algorithm
   `encodeURIComponent(identifier)`.
1. Set `rootCapability.id` to `urn:zcap:root:${encodedIdentifier}`.
1. Set `rootCapability.controller` to `identifier`.
1. Set `rootCapability.invocationTarget` to `identifier`.
1. Return `rootCapability`.

Below is an example root capability for updating the DID document for **did:btc1:k1q0rnnwf657vuu8trztlczvlmphjgc6q598h79cm6sp7c4fgqh0fkc0vzd9u**:

```{.json include="json/CRUD-Operations/Update-zcap-root-capability.json"}
```

#### Dereference Root Capability Identifier

This algorithm takes in a root capability identifier and dereferences it to the
root capability object.

This algorithm takes in a `capabilityId` and returns a `rootCapability` object.

1. Set `rootCapability` to an empty object.
1. Set `components` to the result of `capabilityId.split(":")`.
1. Validate `components`:
   1. Assert length of `components` is 4.
   1. `components[0] == urn`.
   1. `components[1] == zcap`.
   1. `components[2] == root`.
1. Set `uriEncodedId` to `components[3]`.
1. Set `btc1Identifier` the result of `decodeURIComponent(uriEncodedId)`.
1. Set `rootCapability.id` to `capabilityId`.
1. Set `rootCapability.controller` to `btc1Identifier`.
1. Set `rootCapability.invocationTarget` to `btc1Identifier`.
1. Return `rootCapability`.

Below is an example of a `didUpdatePayload`. An invoked ZCAP-LD capability
containing a `patch` defining how the DID document for
**did:btc1:k1q0rnnwf657vuu8trztlczvlmphjgc6q598h79cm6sp7c4fgqh0fkc0vzd9u** SHOULD
be mutated.

```{.json include="json/CRUD-Operations/Update-zcap-root-capability-patch.json"}
```