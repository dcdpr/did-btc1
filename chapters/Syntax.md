## Syntax

A **did:btc1** DID consists of a `did:btc1` prefix, followed by an `id-bech32`
value, which is a [Bech32m](https://github.com/bitcoin/bips/blob/master/bip-0350.mediawiki)
encoding of:

* the specification `version`;
* the Bitcoin `network` identifier; and
* either:
  * a `key-value` representing a secp256k1 public key; or
  * a `hash-value` representing the hash of an initiating external DID document.

The specification `version` and the Bitcoin `network` identifier are encoded
into a single byte as follows:

1. The first four bits (high nibble) are the `version` minus 1. For this version
   of the specification, the `version` is `1` and the high nibble is `0`.
1. The second (remaining) four bits (low nibble) are the Bitcoin `network`
   identifier, one of:
   1. `0` = bitcoin (mainnet);
   1. `1` = signet;
   1. `2` = regtest;
   1. `3` = testnet v3;
   1. `4` = testnet v4;
   1. `5`-`7` = reserved for future use by the specification; or
   1. `8`-`F` = user-defined index into a custom signet network.

The user-defined index into a custom signet network allows any user to stand up
a custom signet network and create **did:btc1** identifiers on it. However,
anyone encountering such an identifier would have to know the details of the
network (challenge and seed node) to use it. This means that:

* The interpretation of a user-defined index is by mutual agreement between
  parties issuing **did:btc1** identifiers and those resolving them.
* Other users may use the same index, and **did:btc1** identifiers will **not**
  be interoperable in each other's network.

When the last part of the encoding is of a `key-value`, the Human Readable Part
(HRP) of the Bech32 encoding is set to `k`. When the last part of the encoding
is of a `hash-value`, the HRP is set to `x`. The HRP is followed by a separator
which is always `1`, which is then followed by the `bech32-encoding`.

The ABNF for a **did:btc1** identifier is as follows:

```abnf
did-btc1 = "did:btc1:" id-bech32
id-bech32 = key-encoding / hash-encoding
hash-encoding = "x1" bech32-encoding
key-encoding = "k1" bech32-encoding
bech32-encoding = *bech32char
bech32char = "0" / "2" / "3" / "4" / "5" / "6" / "7" / "8" / "9" / "a" / "c" / 
"d" / "e" / "f" / "g" / "h" / "j" / "k" / "l" / "m" / "n" / "p" / "q" / "r" / 
"s" / "t" / "u" / "v" / "w" / "x" / "y" / "z" 
```

ABNF is defined by [IETF RFC5234](https://datatracker.ietf.org/doc/html/rfc5234).

### Version Interpretation

The purpose of the `version` is to identify incompatible changes made in the
specification (e.g., a change to the way ::Beacon signals:: are constructed and
interpreted). The updated specification may also change the way that the
**did:btc1** identifier is encoded.

There are two consequences. The first is that the `version` MUST be able to go
beyond the domain of a nibble (1-16). To support this, the start of the decoded
`id-bech32` MUST be interpreted as follows:

1. Set `version` to `1`.
1. Start with the first nibble (the higher nibble of the first byte).
1. Add the value of the current nibble to `version`.
1. If the value of the nibble is hexadecimal `F` (decimal `15`), advance to the
   next nibble (the lower nibble of the current byte or the higher nibble of the
   next byte) and return to the previous step.

More simply:

```text
version = 1 + sum of all nibbles up to and including first non-hexadecimal-F
```

What appears beyond the version is version-specific. Implementations MUST NOT
attempt to interpret **did:btc1** identifiers with an unknown `version`.

For illustration purposes only, assume that the nibble following the version
always represents the network and that the allowable values for the network
don't change. The interpretation of the`version` and `network` would be as
follows (spaces between bytes added for readability):

| Decoded bytes     | Version | Network         |
|-------------------|--------:|-----------------|
| *00* 03 c7 ...    |       1 | bitcoin         |
| *23* 03 c7 ...    |       3 | testnet v3      |
| *C9* 03 c7 ...    |      13 | custom signet 2 |
| *F2 90* 03 c7 ... |      18 | custom signet 2 |
| *FF 72* 03 c7 ... |      38 | regtest         |

### **did:btc1** Identifier Encoding

Given:

* `idType` - required, one of:
  * "key"
  * "external"
* `version` - required, number
* `network` - required, one of:
  * "bitcoin"
  * "signet"
  * "regtest"
  * "testnet3"
  * "testnet4"
  * number
* `genesisBytes` - required, byte array, one of:
  * a compressed secp256k1 public key if `idType` is "key"
  * a hash of an initiating external DID document if `idType` is "external"

Encode the **did:btc1** identifier as follows:

1. If `idType` is not a valid value per above, raise `invalidDid` error.
1. If `version` is not `1`, raise `invalidDid` error.
1. If `network` is not a valid value per above, raise `invalidDid` error.
1. if `network` is a number and is outside the range of 1-8, raise `invalidDid` error.
1. If `idType` is "key" and `genesisBytes` is not a valid compressed secp256k1
   public key, raise `invalidDid` error.
1. Map `idType` to `hrp` from the following:
   1. "key" - "k"
   1. "external" - "x"
1. Create an empty `nibbles` numeric array.
1. Set `fCount` equal to `(version - 1) / 15`, rounded down.
1. Append hexadecimal `F` (decimal `15`) to `nibbles` `fCount` times.
1. Append `(version - 1) mod 15` to `nibbles`.
1. If `network` is a string, append the numeric value from the following map to
   `nibbles`:
    1. "bitcoin" - `0`
    1. "signet" - `1`
    1. "regtest" - `2`
    1. "testnet3" - `3`
    1. "testnet4" - `4`
1. If `network` is a number, append `network + 7` to `nibbles`.
1. If the number of entries in `nibbles` is odd, append `0`.
1. Create a `dataBytes` byte array from `nibbles`, where `index` is from `0` to
   `nibbles.length / 2 - 1` and `encodingBytes[index] =
   (nibbles[2 * index] << 8) | nibbles[2 * index + 1]`.
1. Append `genesisBytes` to `encodingBytes`.
1. Set `identifier` to "did:btc1:".
1. Pass `hrp` and `dataBytes` to the [Bech32m Encoding] algorithm, retrieving
   `encodedString`.
1. Append `encodedString` to `identifier`.
1. Return `identifier`.

### **did:btc1** Identifier Decoding

Given:

* `identifier` - required, a string ***did:btc1** identifier

Decode the **did:btc1** identifier as follows:

1. Split `identifier` into an array of `components` at the colon `:` character.
1. If the length of the `components` array is not `3`, raise `invalidDid` error.
1. If `components[0]` is not "did", raise `invalidDid` error.
1. If `components[1]` is not "btc1", raise `methodNotSupported` error.
1. Set `encodedString` to `components[2]`.
1. Pass `encodedString` to the [Bech32m Decoding] algorithm, retrieving `hrp`
   and `dataBytes`.
1. If the Bech32m decoding algorithm fails, raise `invalidDid` error.
1. Map `hrp` to `idType` from the following:
   1. "k" - "key"
   1. "x" - "external"
   1. other - raise `invalidDid` error
1. Set `version` to `1`.
1. If at any point in the remaining steps there are not enough nibbles to
   complete the process, raise `invalidDid` error.
1. Start with the first nibble (the higher nibble of the first byte) of
   `dataBytes`.
1. Add the value of the current nibble to `version`.
1. If the value of the nibble is hexadecimal `F` (decimal `15`), advance to the
   next nibble (the lower nibble of the current byte or the higher nibble of the
   next byte) and return to the previous step.
1. If `version` is not `1`, raise `invalidDid` error.
1. Advance to the next nibble and set `networkValue` to its value.
1. Map `networkValue` to `network` from the following:
   1. `0` - "bitcoin"
   1. `1` - "signet"
   1. `2` - "regtest"
   1. `3` - "testnet3"
   1. `4` - "testnet4"
   1. `5`-`7` - raise `invalidDid` error
   1. `8`-`F` - `networkValue - 7`
1. If the number of nibbles consumed is odd:
   1. Advance to the next nibble and set `fillerNibble` to its value.
   1. If `fillerNibble` is not `0`, raise `invalidDid` error.
1. Set `genesisBytes` to the remaining `dataBytes`.
1. If `idType` is "key" and `genesisBytes` is not a valid compressed secp256k1
   public key, raise `invalidDid` error.
1. Return `idType`, `version`, `network`, and `genesisBytes`.

### Differentiating **did:btc1** Identifiers

This section is non-normative.

It is sometimes useful to differentiate between production (bitcoin network) and
test (other network) **did:btc1** identifiers without having to go through the
decoding process.

Bech32 encodes five bits at a time, so the version and network (8 bits, assuming
version is 15 or below) can be interpreted by looking at the first two
characters. How that manifests depends on the HRP.

With HRP `k`, there is the additional advantage that the first nibble of the
public key is always zero (because the first byte is either 02 or 03, indicating
the sign). That means that, for version 1 on bitcoin network, the first three
nibbles (12 bits) are zero, which translates to "qq" (five bits zero followed by
five bits zero), with two bits (also zero) left over. Any `did:btcr1:k1qq...`
pattern is therefore version 1 on bitcoin.

HRP `x` is a little more complicated, because the extra two bits for the second
block of five bits could be any of four values. Therefore, there are four
two-character strings that could appear after the '1' separator: "qq", "qp",
"qz", and "qr". Any `did:btcr1:x1qq...`, `did:btcr1:x1qp...`,
`did:btcr1:x1qz...`, or `did:btcr1:x1qr...` pattern is therefore version 1 on
bitcoin.

If the version changes, the strings change as well. Version 2 on bitcoin would
encode HRP `k` as "zq" and HRP `x` as "zq", "zp", "zz", or "zr".
