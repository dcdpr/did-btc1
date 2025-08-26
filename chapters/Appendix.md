## Appendix

### Bech32m Encoding and Decoding

**did:btc1** uses the Bech32m algorithm to encode and decode several data values.
The original Bech32 algorithm is documented in
[BIP-0173](https://github.com/bitcoin/bips/blob/master/bip-0173.mediawiki). The updated algorithm, Bech32m, is documented in
[BIP-0350](https://github.com/bitcoin/bips/blob/master/bip-0350.mediawiki).

#### Bech32m Encoding

Given:

* `hrp` - required, a string representing the Human-Readable Part (HRP) of the encoding
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
bytes to an InterPlanetary File System (IPFS) v1 ::Content Identifier:: (CID) and attempts 
to retrieve the identified content from ::Content Addressable Storage:: (CAS). 

The function returns the retrieved `content` or null.

1. Set `cid` to the result of converting `hashBytes` to an IPFS v1 ::CID::.
1. Set `content` to the result of fetching the `cid` from a ::CAS:: system. Which ::CAS:: systems 
   checked is left to the implementation. TODO: Is this right? Are implementations just supposed to check all CAS they trust?
1. If content for `cid` cannot be found, set `content` to null.
1. Return `content`

### Root did:btc1 Update Capabilities

Note: Not sure if these algorithms should go here or in the appendix?

#### Derive Root Capability from **did:btc1** Identifier

This algorithm deterministically generates an [Authorization Capabilities for Linked Data](https://w3c-ccg.github.io/zcap-spec/) (ZCAP-LD) root capability from a given **did:btc1** identifier. Each root 
capability is unique to the identifier. This root capability is defined and understood 
by the **did:btc1** specification as the root capability to authorize updates to the 
specific **did:btc1** identifiers DID document.

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

Below is an example of a `btc1Update`. An invoked [ZCAP-LD](https://w3c-ccg.github.io/zcap-spec/)
capability containing a `patch` defining how the DID document for
**did:btc1:k1q0rnnwf657vuu8trztlczvlmphjgc6q598h79cm6sp7c4fgqh0fkc0vzd9u** SHOULD
be mutated.

```{.json include="json/CRUD-Operations/Update-zcap-root-capability-patch.json"}
```
