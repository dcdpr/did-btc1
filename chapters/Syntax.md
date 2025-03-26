## Syntax

A **did:btc1** DID consists of a `did:btc1` prefix, followed by an OPTIONAL
`version` number, an OPTIONAL Bitcoin `network` identifier, and, finally, a
`id-bech32` value. The `id-bech32` is a Bech32 encoding of either a `key-value`
representing a secp256k1 public key, or a `hash-value` of an initiating DID
document. When the encoding is of a `key-value` the Human Readable Part (HRP) of
the Bech32 encoding is set to `k`. When the encoding is of a `hash-value` the
HRP is set to `x`. The HRP is followed by a separator which is always `1`, this
is then followed by the `bech32-encoding`.

The ABNF for a **did:btc1** DID follows:

```abnf
did-btc1 = "did:btc1:" [ version ":" ] [ network ":" ] id-bech32
version	= 1*DIGIT
network =  "mainnet" / "signet" / "testnet" / "regtest"
id-bech32 = key-value / hash-value
hash-value = "x1" bech32-encoding
key-value = "k1" bech32-encoding
bech32-encoding = *bech32char
bech32char = "0" / "2" / "3" / "4" / "5" / "6" / "7" / "8" / "9" / "a" / "c" / 
"d" / "e" / "f" / "g" / "h" / "j" / "k" / "l" / "m" / "n" / "p" / "q" / "r" / 
"s" / "t" / "u" / "v" / "w" / "x" / "y" / "z" 
```

ABNF is defined by the [IETF RFC5234](https://datatracker.ietf.org/doc/html/rfc5234).

### Examples

All four following DIDs are equivalent:

* did:btc1:k1q2ddta4gt5n7u6d3xwhdyua57t6awrk55ut82qvurfm0qnrxx5nw7vnsy65 - MOST COMMON
* did:btc1:<u>1:</u>k1q2ddta4gt5n7u6d3xwhdyua57t6awrk55ut82qvurfm0qnrxx5nw7vnsy65
* did:btc1:<u>mainnet:</u>k1q2ddta4gt5n7u6d3xwhdyua57t6awrk55ut82qvurfm0qnrxx5nw7vnsy65
* did:btc1:<u>1:mainnet:</u>k1q2ddta4gt5n7u6d3xwhdyua57t6awrk55ut82qvurfm0qnrxx5nw7vnsy65
