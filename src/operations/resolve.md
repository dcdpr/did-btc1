{% import "includes/ui.tera" as ui %}
{% import "includes/links.tera" as links %}

{{ links::include(root="../") }}


# Resolve

Resolving a **did:btcr2** identifier iteratively builds a DID document by applying [BTCR2 Updates][BTCR2 Update] committed to the Bitcoin blockchain by [Authorized Beacon Signals][Authorized Beacon Signal] to an [Initial DID Document]. The [Initial DID Document] is either deterministically created from the DID or provided by [Sidecar Data].

DID resolution is defined by DID Resolution v1 {{#cite DID-RESOLUTION}}.

The resolve operation has the following function signature:

```rust
fn resolve(did, resolutionOptions) ->
  (didResolutionMetadata, didDocument, didDocumentMetadata)
```


## Process

Input values MUST first go through [Decoding the DID](#decode-the-did) and [Processing Sidecar Data](#process-sidecar-data).

Raise an [`INVALID_OPTIONS`] error if `resolutionOptions` contains both `versionId` and `versionTime`. [^1]

[^1]: DID Resolution v1 {{#cite DID-RESOLUTION}} defines the two options as mutually exclusive.

When provided, `resolutionOptions.versionId` MUST be parsed as an integer and `resolutionOptions.versionTime` SHOULD be parsed as an XML Datetime. Raise an [`INVALID_OPTIONS`] error if either value does not parse.

Resolution maintains the following state while building the DID document:

* `updates`: a list of tuples, each containing Bitcoin block metadata (height, mediantime, confirmations) and a [BTCR2 Signed Update (data structure)].
* `scanned_beacons`: a list of [Beacon Addresses][Beacon Address] that [Find Beacon Signals](#find-beacon-signals) scanned (starts empty).
* `current_document`: the DID document being assembled.
* `current_version_id`: the version number being processed (starts at `1`).
* `update_hash_history`: a list of [BTCR2 Unsigned Update] hashes used to detect duplicates.
* `block_confirmations`: confirmations for the Bitcoin block that contains the most recently applied unique update (starts at `0`).

The resolver:

1. [Establishes `current_document`](#establish-current-document) from the DID or from [Sidecar Data].
2. Repeats the following loop:
    * [Find Beacon Signals](#find-beacon-signals) to add tuples to `updates` from the beacon services in `current_document`.
    * [Process Next Update](#process-next-update) to apply one update to `current_document` and refresh `block_confirmations`.
    * The loop terminates when [Process Next Update](#process-next-update) resolves `didDocument` or an error occurs.

The resolver returns:

* `didResolutionMetadata`: a [DID Resolution Metadata (data structure)] (MAY be empty).
* `didDocument`: the final [DID document (data structure)].
* `didDocumentMetadata`: a [DID document metadata (data structure)] with REQUIRED fields:
  * `versionId`: `current_version_id` as an ASCII string.
  * `confirmations`: `block_confirmations` as an integer. [^2]
  * `deactivated`: `current_document.deactivated`.

[^2]: The number of confirmations for the Bitcoin block that contains the most recently applied unique update that yielded the resolved DID document. "Unique" refers to handling duplicated updates. When deduplicating, use the lowest block height to determine confirmations.


## Decode the DID { #decode-the-did }

The `did` MUST be parsed with the [DID-BTCR2 Identifier Decoding] algorithm to retrieve `version`,
`network`, and `genesis_bytes`. An [`INVALID_DID`] error MUST be raised in response to any errors
raised while decoding.


## Process Sidecar Data { #process-sidecar-data }

`resolutionOptions` contains a `sidecar` property ([Sidecar Data (data structure)]) which SHOULD be prepared as lookup tables:

- Hash each [BTCR2 Signed Update (data structure)] in `sidecar.updates` with the [JSON Document Hashing] algorithm and build a map from hash to update (`update_lookup_table`).
- Hash each [CAS Announcement (data structure)] in `sidecar.casUpdates` with the [JSON Document Hashing] algorithm and build a map from hash to announcement (`cas_lookup_table`).
- Build a map from `sidecar.smtProofs` keyed by proof `id` (`smt_lookup_table`).

If `genesis_bytes` is a SHA-256 hash, hash `sidecar.genesisDocument` with the [JSON Document Hashing] algorithm. If `sidecar.genesisDocument` is not provided, retrieve it from [CAS] using `genesis_bytes` as described in [BTCR2 Update Data Distribution]. Raise a [`NOT_FOUND`] error if the [Genesis Document] cannot be retrieved. Raise an [`INVALID_DID`] error if the computed hash does not match `genesis_bytes`.

When data is not available in [Sidecar Data], implementations are RECOMMENDED to retrieve it from a [Content Addressable Storage][CAS] ([CAS]) service. To retrieve a document from [CAS], construct a CID from the document's SHA-256 hash bytes as described in [BTCR2 Update Data Distribution].


## Establish `current_document` { #establish-current-document }

Resolution begins by creating an [Initial Did Document] called `current_document` ([Current DID Document]). The `current_document` is iteratively patched with [BTCR2 Signed Updates][BTCR2 Signed Update] announced by [Authorized Beacon Signals][Authorized Beacon Signal].

Choose how to establish `current_document` based on the type of `genesis_bytes` retrieved from the decoded `did`:


### If `genesis_bytes` is a SHA-256 Hash

Process the [Genesis Document] provided in `sidecar.genesisDocument` by replacing the identifier placeholder (`"did:btcr2:_"`) with the `did`. A simple string replacement is sufficient. Parse the result as JSON to form `current_document`. The resulting [DID Document (data structure)] MUST be conformant to DID Core v1.1 {{#cite DID-CORE}}.


### If `genesis_bytes` is a secp256k1 Public Key

Render the [Initial DID Document] template with these values (Bitcoin addresses MUST use the Bitcoin URI Scheme {{#cite BIP321}}):

* `did`: The `did`.
* `public-key-multikey`: Public key as a Multibase `"base-58-btc"` {{#cite CONTROLLED-IDENTIFIERS}} encoded string.
* `p2pkh-bitcoin-address`: Pay-to-Public-Key-Hash (P2PKH) Bitcoin address produced from the public key.
* `p2wpkh-bitcoin-address`: Pay-to-Witness-Public-Key-Hash (P2WPKH) Bitcoin address produced from the public key.
* `p2tr-bitcoin-address`: Pay-to-Taproot (P2TR) Bitcoin address produced from the public key.

{% set hide_text = `` %}
{% set initial_did_document_template =
`
~~~hbs
{{#include ../example-data/key-based-initial-did-document-template.hbs}}
~~~
` %}

{{ ui::show_example_tabs(
  group_id="initial-did-document-template",
  example=initial_did_document_template,
  hide=hide_text,
  default="hide",
  show_label="Show Template",
  hide_label="Hide"
) }}

Parse the rendered template as JSON to form `current_document`. The resulting [DID Document (data structure)] MUST be conformant to DID Core v1.1 {{#cite DID-CORE}}.


## Find Beacon Signals { #find-beacon-signals }

Scan the `service` entries in `current_document` ([DID Document (data structure)]) and identify [BTCR2 Beacons][BTCR2 Beacon] by matching service `type` to [Beacons Table 1: Beacon Types]. Parse each beacon `serviceEndpoint` as a [Beacon Address].

For each [Beacon Address] that is not in `scanned_beacons`:

* Find the Bitcoin transactions that spend from the [Beacon Address] and whose last output script contains [Signal Bytes].
* Add the [Beacon Address] to `scanned_beacons`.

Implementations are RECOMMENDED to query an indexed Bitcoin blockchain Remote Procedure Call (RPC) service such as [electrs](https://github.com/romanz/electrs) or [Esplora](https://github.com/Blockstream/esplora). Implementations MAY instead traverse blocks from the genesis block.

A transaction MUST be included in a Bitcoin block and have at least `resolutionOptions.minConf` confirmations (`6` when not provided). Unconfirmed mempool transactions MUST NOT be processed. [^3]

[^3]: Six confirmations is the widely accepted industry standard for treating a Bitcoin transaction as settled. Resolution requests can raise or lower `minConf` to match their own threat and security model; lowering it increases exposure to Bitcoin block reorganizations, which consumers can evaluate from the returned `confirmations` metadata.

For each transaction found:

* Derive `update_hash` from the transaction's [Signal Bytes] based on the [Beacon Type]:
  * [Singleton Beacon]: `update_hash` is the [Signal Bytes].
  * [CAS Beacon]: use [Process CAS Beacon](#process-cas-beacon).
  * [SMT Beacon]: use [Process SMT Beacon](#process-smt-beacon).
* Build a tuple with:
  * The transaction's block metadata (height, mediantime, and confirmations).
  * The [BTCR2 Signed Update (data structure)] retrieved from `update_lookup_table[update_hash]`.
    * If the update is not in `update_lookup_table`, retrieve it from [CAS] using `update_hash` as described in [BTCR2 Update Data Distribution].
    * Raise a [`MISSING_UPDATE_DATA`] error if the update is not available from either source.
* Append the tuple to `updates`.


### Process CAS Beacon { #process-cas-beacon }

Treat [Signal Bytes] as `map_update_hash`. Look up `map_update_hash` in `cas_lookup_table` to retrieve a [CAS Announcement (data structure)] and read `update_hash` from the announcement entry keyed by `did`. If the [CAS Announcement (data structure)] is not in `cas_lookup_table`, retrieve it from [CAS] using `map_update_hash` as described in [BTCR2 Update Data Distribution].


### Process SMT Beacon { #process-smt-beacon }

Treat [Signal Bytes] as `smt_root`. Look up `smt_root` in `smt_lookup_table` to retrieve an [SMT Proof (data structure)]. Validate the proof with the [SMT Proof Verification] algorithm. Use `smt_proof.updateId` as `update_hash`.


## Process Next Update { #process-next-update }

1. If `resolutionOptions.versionId` is provided and `current_version_id` is equal to the parsed `resolutionOptions.versionId`, resolve `current_document` as `didDocument`.
2. If `updates` is empty or `current_document.deactivated` is `true`:
    * Raise a [`NOT_FOUND`] error if `resolutionOptions.versionId` is provided.
    * Otherwise, resolve `current_document` as `didDocument`.
3. Sort `updates` by [BTCR2 Signed Update (data structure)] `targetVersionId` (ascending) with the tuple's block height as a tiebreaker. Remove the first tuple from `updates`.
4. Resolve `current_document` as `didDocument` if all of the following conditions are true:
    * The tuple's `targetVersionId` is more than `current_version_id`. [^4]
    * `resolutionOptions.versionTime` is provided.
    * The tuple's block `mediantime` {{#cite Bitcoin-Core}} is after `resolutionOptions.versionTime`. [^5]
5. Set `block_confirmations` to the tuple's block confirmations.
6. Set `update` to the tuple's [BTCR2 Signed Update (data structure)] and [check `update.targetVersionId`](#check-update-version).

[^4]: This condition is necessary because the resolver accepts a duplicate update ([Confirm Duplicate Update](#confirm-duplicate-update)). The block of a duplicate can be after `versionTime` while the block of a subsequent version is before `versionTime`. Without this condition, the resolver stops at the duplicate and does not apply the subsequent version.

[^5]: The resolver applies an update whose block `mediantime` is equal to `versionTime`. The comparison has no tolerance. `mediantime` does not decrease from one block to the next. Each resolver reads the same value from the block chain, so each resolver selects the same version.


### Check `update.targetVersionId` { #check-update-version }

Compare `update.targetVersionId` to `current_version_id`. Only one of three possible conditions will occur:

* `update.targetVersionId <= current_version_id`:
  * [Confirm Duplicate Update](#confirm-duplicate-update).
* `update.targetVersionId == current_version_id + 1`:
  * [Apply `update`](#apply-update).
* `update.targetVersionId > current_version_id + 1`:
  * [`LATE_PUBLISHING`] error MUST be raised.


### Confirm Duplicate Update { #confirm-duplicate-update }

This step confirms that an update with a lower-than-expected `targetVersionId` is a true duplicate.

Raise an [`INVALID_DID_UPDATE`] error if `update.targetVersionId` is less than `2`.

Create `unsigned_update` by removing the `proof` property from `update`. Hash `unsigned_update` with the [JSON Document Hashing] algorithm and compare it to `update_hash_history[update.targetVersionId - 2]`. Raise a [`LATE_PUBLISHING`] error if the hashes differ.


### Apply `update` { #apply-update }

Hash `current_document` with the [JSON Document Hashing] algorithm. Raise an [`INVALID_DID_UPDATE`] error if the result does not match the decoded `update.sourceHash`.

[Check `update.proof`](#check-update-proof).

Apply the `update.patch` JSON Patch {{#cite RFC6902}} to `current_document`. Raise an [`INVALID_DID_UPDATE`] error if `update.patch` is malformed or fails to apply. JSON Patch operations are evaluated in order; the first operation that fails, including a failed `test` operation, fails the whole patch.

Verify that `current_document` conforms to DID Core v1.1 {{#cite DID-CORE}} and that `current_document.id` equals `did`. Otherwise raise [`INVALID_DID_UPDATE`].

Hash the patched `current_document` with the [JSON Document Hashing] algorithm. Raise an [`INVALID_DID_UPDATE`] error if the result does not match the decoded `update.targetHash`.

Create `unsigned_update` by removing the `proof` property from `update`, hash it with the [JSON Document Hashing] algorithm, and append the hash to `update_hash_history`. 

Increment `current_version_id`.


### Check `update.proof` { #check-update-proof }

Raise an [`INVALID_DID_UPDATE`] error if the `@context` of `update` is not the array that the [BTCR2 Unsigned Update (data structure)] specifies. Raise an [`INVALID_DID_UPDATE`] error if the `@context` of `update.proof` is not equal to the `@context` of `update`. Two `@context` arrays are equal when they contain the same context URLs in the same order.

Raise an [`INVALID_DID_UPDATE`] error if any of the following conditions are not true:

* `update.proof.proofPurpose` equals `"capabilityInvocation"`.
* `update.proof.capabilityAction` equals `"Write"`.
* `update.proof.capability` equals the `capability` URN that [Data Integrity Config (data structure)] specifies for `did`.

Implementations MAY derive a [Root Capability (data structure)] from `update.proof` and invoke it according to Authorization Capabilities for Linked Data v0.3 {{#cite ZCAP-LD}}.

The resolver MUST find the entry of `current_document.capabilityInvocation` that identifies `update.proof.verificationMethod`. A reference entry identifies it when the two values are equal. An embedded verification method object identifies it when the `id` of the object is equal. Raise an [`INVALID_DID_UPDATE`] error if no entry identifies it.

Read `publicKeyMultibase` from that entry. When the entry is an embedded verification method object, read `publicKeyMultibase` from the object. When the entry is a reference, find the verification method in `current_document.verificationMethod` with an `id` that is equal to the reference. Read `publicKeyMultibase` from that verification method. Raise an [`INVALID_DID_UPDATE`] error if there is no verification method with that `id`.

If `update.proof.created` or `update.proof.expires` is present, check each value against the Bitcoin block that contains the [Beacon Signal] that announced `update`. [^6] Raise an [`INVALID_DID_UPDATE`] error if any of the following conditions are true:

* `update.proof.created` is after the timestamp in the block header.
* `update.proof.expires` is before the block `mediantime` {{#cite Bitcoin-Core}}.
* `update.proof.expires` is before `update.proof.created`, when both values are present.

[^6]: In Data Integrity {{#cite VC-DATA-INTEGRITY}}, each method selects the time of interest for `created` and `expires`. On mainnet, the timestamp in the block header is approximately one hour later than `mediantime`. A controller signs a proof a short time before the block that contains it, so a check of `created` against `mediantime` rejects valid updates. For this reason, `created` uses the timestamp in the block header. A miner sets the timestamp in the header of its own block and can increase that value, but a single miner cannot change `mediantime`. The `expires` value limits the time between the signature and a replay of the update, so `expires` uses `mediantime`.

Use a BIP340 Cryptosuite {{#cite BIP340-Cryptosuite}} instance with `publicKeyMultibase` and the `"bip340-jcs-2025"` cryptosuite to verify `update`. Raise [`INVALID_DID_UPDATE`] if verification fails.

<!-- Line breaks to visibly separate the preceding subsection from the chapter footnotes. -->
<br>
<br>
