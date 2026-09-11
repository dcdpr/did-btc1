{% import "includes/ui.tera" as ui %}
{% import "includes/links.tera" as links %}

{{ links::include() }}


# Algorithms

These algorithms are referenced throughout this specification.

## DID-BTCR2 Identifier Encoding

Any errors encountered during this algorithm MUST raise an [`INVALID_DID`] error.

A **did:btcr2** identifier is created from three arguments: `version_number`, `network_name` and `key_or_hash` ([Genesis Bytes]).

`key_or_hash` MUST be one of the supported [Genesis Bytes] variants defined in the Terminology chapter and MUST be representable as a 33-byte secp256k1 public key or a 32-byte SHA-256 hash. Implementations SHOULD require `key_or_hash` to include additional type information that clearly distinguishes between the supported [Genesis Bytes] variants. This type information determines how the identifier is encoded.

The `version_number` value MUST be `1`, declaring the encoding follows this specification.

The `network_name` value declares which Bitcoin network anchors the identifier. Implementations SHOULD require `network_name` to include additional type information using symbolic names that MUST be representable as integer values listed in the following table:

### Table 1: Network Values { #network-values }

| `network_name`   | `network_value` |
|:-----------------|:----------------|
| `bitcoin`        | `0`             |
| `signet`         | `1`             |
| `regtest`        | `2`             |
| `testnet3`       | `3`             |
| `testnet4`       | `4`             |
| `mutinynet`      | `5`             |
| Reserved         | `6`..`11`       |
| Custom networks  | `12`..`15`      |

`Reserved` network values MUST NOT be encoded until this specification assigns them.

A `Custom networks` value allows any user to stand up a custom network and create **did:btcr2** identifiers on it. Anyone encountering such an identifier has to know the details of the network (e.g., the challenge and seed nodes for a custom signet) to use it. This means:

* The interpretation of a custom value is by mutual agreement between the parties issuing **did:btcr2** identifiers and those resolving them.
* Other users may use the same value, and their **did:btcr2** identifiers will **not** be interoperable in each other's networks.

Introduce `btcr2_version` as `version_number - 1` (i.e., `0`). Combine `btcr2_version` in the low [^1] nibble and `network_value` in the high [^1] nibble into a single byte value.

[^1]: Little Endian.

Append `key_or_hash` to the first byte to produce the unencoded data bytes. Its format is:

### Table 2: Unencoded Data Bytes { #unencoded-data-bytes }

|             | `btcr2_version`  | `network_value` | `genesis_bytes` |
|:------------|:-----------------|:----------------|:----------------|
| Size:       | 4 bits           | 4 bits          | 32 or 33 bytes  |
| Index [^2]: | 0                | 4               | 8               |

[^2]: The "Index" is a Little Endian bit count starting from `0` on the left and ending in `263` or `271` on the right (inclusive).

Encode the unencoded data bytes with Bech32m [^3] to produce the `method-specific-id`, which MUST be lowercase. Use `"k"` as the `hrp` for key-based `key_or_hash` and `"x"` as the `hrp` for [Genesis Document]-based `key_or_hash`.

[^3]: The `method-specific-id` MUST be conformant to Bech32m {{#cite BIP350}}, which extends Bech32 {{#cite BIP173}}. On encode, pad the final 5-bit group with zero bits; on decode, an incomplete final group MUST be 4 bits or fewer, MUST be all zeros, and is discarded.

Prefix the `method-specific-id` with the string `"did:btcr2:"` to produce the final **did:btcr2** identifier.


{% set hide_text = `` %}
{% set ex_identifier_encoding =
'
Example input:

* `version_number`: `1`
* `network_name`: `bitcoin` (`network_value` = `0`)
* `key_or_hash`: SEC encoded secp256k1 public key
  `0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798`

Example output:

* `did`: `"did:btcr2:k1qqp8n0nx0muaewav2ksx99wwsu9swq5mlndjmn3gm9vl9q2mzmup0xqhmkf96"`' %}

{{ ui::show_example_tabs(
  group_id="identifier-encoding-example",
  example=ex_identifier_encoding,
  hide=hide_text,
  default="hide",
  show_label="Show Example",
  hide_label="Hide"
) }}


## DID-BTCR2 Identifier Decoding

Any errors encountered during this algorithm MUST raise an [`INVALID_DID`] error.

Parsing a **did:btcr2** identifier produces three values: `version_number`, `network_name`, and `key_or_hash` ([Genesis Bytes]).

A **did:btcr2** identifier MUST be processed according to the DID Resolution Algorithm {{#cite DID-RESOLUTION}} to retrieve the **did:btcr2** DID Method-specific ID `method-specific-id`. (I.e., the first 10 characters in the string MUST be exactly `"did:btcr2:"`.)

The `method-specific-id` MUST be lowercase. Decode it as a Bech32m encoded string [^3] to retrieve the unencoded data bytes and the `hrp`. Parse the unencoded data bytes according to [Table 2: Unencoded Data Bytes](#unencoded-data-bytes) to retrieve the `btcr2_version`, `network_value` and `genesis_bytes`.

* `btcr2_version` MUST be `0`. Introduce `version_number` as `btcr2_version + 1`. I.e., `version_number` MUST be returned to the caller as a type that can be represented as the value `1`.
* `network_value` MUST be handled according to its row in [Table 1: Network Values](#network-values):
  * A named network value (`0`..`5`) maps to its `network_name`. `network_name` SHOULD be returned to the caller including additional type information using symbolic names that can be represented as integer values.
  * A `Reserved` value (`6`..`11`) MUST be rejected until this specification assigns it a `network_name`.
  * A `Custom networks` value (`12`..`15`) SHOULD be rejected when the implementation does not support a custom network for that value. What it means to support a custom network is implementation-defined.
* The `hrp` MUST be either `"k"` or `"x"`.

If the `hrp` is `"k"` (key-based **btcr2:did** identifier), `key_or_hash` MUST be `genesis_bytes` interpreted as a 33-byte SEC encoded secp256k1 public key.

If the `hrp` is `"x"` ([Genesis Document]-based **btcr2:did** identifier), `key_or_hash` MUST be `genesis_bytes` interpreted as a 32-byte SHA-256 hash of a [Genesis Document].

Decoding inverts encoding exactly: passing the `version_number`, `network_name`, and `key_or_hash` produced by this algorithm to the [DID-BTCR2 Identifier Encoding] algorithm MUST reproduce the identical **did:btcr2** identifier string.


{% set hide_text = `` %}
{% set ex_identifier_decoding =
'
Example input:

* `did`: `"did:btcr2:x1qhjw6jnhwcyu5wau4x0cpwvz74c3g82c3uaehqpaf7lzfgmnwsd7spmmf54"`

Example output:

* `version_number`: `1`
* `network_name`: `mutinynet` (`network_value` = `5`)
* `key_or_hash`: SHA-256 hash `e4ed4a777609ca3bbca99f80b982f571141d588f3b9b803d4fbe24a373741be8`' %}

{{ ui::show_example_tabs(
  group_id="identifier-decoding-example",
  example=ex_identifier_decoding,
  hide=hide_text,
  default="hide",
  show_label="Show Example",
  hide_label="Hide"
) }}


## JSON Document Hashing

* Encode the document using JCS {{#cite RFC8785}}.
* Hash the encoded document with SHA-256 {{#cite SHA256}}.

## SMT Proof Verification

To verify the inclusion or non-inclusion of a DID in the [SMT Proof], perform the following steps:

Throughout this section, `hash()` denotes SHA-256 {{#cite SHA256}} over a byte sequence. The byte sequence has no length limit. `concat()` (equivalently, the `+` operator) concatenates two 32-byte values into one 64-byte value. `0` denotes 32 zero bytes. `bitAt(i)` of a 32-byte value counts from left to right. `bitAt(0)` is the most significant bit of the first byte. `bitAt(255)` is the least significant bit of the last byte. The `base64url` {{#cite RFC4648}} encoded fields of an [SMT Proof (data structure)] (`id`, `nonce`, `updateId`, `collapsed`, and the entries of `hashes`) MUST be decoded to their raw bytes before being used in any of these operations.

Construct a hashed-zero cache. `cachedZero[0]` is the value of an empty leaf and is equal to `hash(0 + 0)`. `cachedZero[n]` is the value of an empty subtree at height `n` and is equal to `hash(cachedZero[n-1] + cachedZero[n-1])`.

{% set hide_text = `` %}
{% set pseudocode_construct_hashed_zero_cache =
`
~~~rust
let cachedZero = [];
let z = 0;  // 32 zero bytes

for n in 0..=255 {
  z = hash(concat(z, z));
  cachedZero[n] = z;
}
~~~
` %}

{{ ui::show_example_tabs(
group_id="construct_hashed_zero_cache",
example=pseudocode_construct_hashed_zero_cache,
hide=hide_text,
default="hide",
show_label="Show Pseudocode",
hide_label="Hide"
) }}


The result of the algorithm MUST be `false` if any of the following conditions are true:

* The proof has an `updateId`, and the decoded `updateId` is not 32 bytes.
* The decoded `collapsed` is not 32 bytes.
* A decoded entry of `hashes` is not 32 bytes.
* The number of entries in `hashes` plus the number of `1` bits in `collapsed` is not `256`.

The OPTIONAL fields `nonce` and `updateId` of the [SMT Proof (data structure)] select the leaf value of the index of `did`. The DID controller selects the fields for each index and each [Beacon Signal]:

* `nonce` and `updateId`: `hash(hash(nonce) + updateId)`. The [Beacon Signal] announces the update.
* `nonce` only: `hash(hash(nonce))`. The [Beacon Signal] announces no update.
* `updateId` only: `updateId`. The [Beacon Signal] announces the update.
* No `nonce` and no `updateId`: `cachedZero[0]`, the value of an empty leaf. The [Beacon Signal] announces no update, and the index is empty.

The [SMT Proof (data structure)] is verified by walking the tree starting from the leaf value to the root `proof.id`. Walking the tree means hashing sibling hashes from `proof.hashes` concatenated with a candidate hash to construct each node value. Each bit within the leaf node index (given by `hash(did)`) selects the side of the candidate hash: `0` for left, `1` for right. The sibling hash is on the other side. The walk starts at the leaf with `bitAt(255)` and stops at the root with `bitAt(0)`.

The tree is "optimized" by collapsing empty nodes. (See [Appendix: Optimized Sparse Merkle Tree Implementation] for definition of "optimized".) Each bit within `proof.collapsed` informs the algorithm whether to take the next sibling hash from `proof.hashes` (0) or use a hashed zero from the current height of the tree (1).

The last step is asserting that the computed candidate hash is equivalent to `proof.id` (the Merkle root).

{% set hide_text = `` %}
{% set pseudocode_smt_proof_verification =
`
~~~rust
if let Some(updateId) = proof.updateId {
  if updateId.len() != 32 { return false; }
}
if proof.collapsed.len() != 32 { return false; }
for siblingHash in &proof.hashes {
  if siblingHash.len() != 32 { return false; }
}
if proof.hashes.len() + proof.collapsed.count_ones() != 256 {
  return false;
}

let candidateHash = match (proof.nonce, proof.updateId) {
  (Some(nonce), Some(updateId)) => hash(concat(hash(nonce), updateId)),  // update, private
  (Some(nonce), None)           => hash(hash(nonce)),                    // no update, private
  (None,        Some(updateId)) => updateId,                             // update, public
  (None,        None)           => cachedZero[0],                        // empty index
};

let index = hash(did);

// bitAt(i): bit i, counted from left to right over the 32 bytes.
// n = 0 is the leaf level (i = 255), n = 255 is the root level (i = 0).
for n in 0..=255 {
  let i = 255 - n;

  let siblingHash = if proof.collapsed.bitAt(i) == 1 {
    cachedZero[n]
  } else {
    proof.hashes.pop_front()
  };

  if index.bitAt(i) == 1 {
    candidateHash = hash(concat(siblingHash, candidateHash));
  } else {
    candidateHash = hash(concat(candidateHash, siblingHash));
  }
}

return candidateHash == proof.id;
~~~
` %}

{{ ui::show_example_tabs(
group_id="pseudocode_smt_proof_verification",
example=pseudocode_smt_proof_verification,
hide=hide_text,
default="hide",
show_label="Show Pseudocode",
hide_label="Hide"
) }}

<!-- Line breaks to visibly separate the preceding subsection from the chapter footnotes. -->
<br>
<br>
