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

This algorithm takes two REQUIRED inputs: a string, `hrp` which is the human
readable part of the encoding and a array of bytes to be encoded called the
`dataPart`.

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

1. Set `canonicalBytes` to the result of applying the JSON Canonicalziation Scheme
   to the `document`.
1. Set `hashBytes` to the result of applying the SHA256 cryptographic hashing
   algorithm to the `canonicalBytes`.
1. Return `hashBytes`.
