## CRUD Operations

This section defines the Create, Read, Update, and Deactivate (CRUD) operations
for the **did:btc1** method.

### Create

A **did:btc1** identifier and associated DID document can either be created
deterministically from a cryptographic seed, or it can be created from an arbitrary
genesis intermediate DID document representation. In both cases, DID creation can
be undertaken in an offline manner, i.e., the DID controller does not need to
interact with the Bitcoin network to create their DID.

#### Deterministic Key-based Creation

For deterministic creation, the **did:btc1** identifier encodes a secp256k1 public key.
The key is then used to deterministically generate the initial DID document.

The algorithm takes in `pubKeyBytes`, a compressed SEC encoded secp256k1
public key and optional `version` and `network` values. The algorithm returns a
**did:btc1** identifier and corresponding initial DID document.

1. Set `idType` to "key".
1. Set `version` to `1`.
1. Set `network` to the desired network.
1. Set `genesisBytes` to `pubKeyBytes`.
1. Pass `idType`, `version`, `network`, and `genesisBytes` to the [did:btc1
   Identifier Encoding](#didbtc1-identifier-encoding) algorithm, retrieving
   `id`.
1. Set `did` to `id`.
1. Set `initialDocument` to the result of passing `did` into the [Read] algorithm.
1. Return `did` and `initialDocument`.

#### External Initial Document Creation

It is possible to create a **did:btc1** from some initiating arbitrary DID document.
This allows for more complex initial DID documents, including the ability to include
Service Endpoints and ::Beacons:: that support aggregation.

The algorithm takes in an `intermediateDocument` struct, an OPTIONAL `version`,
and an OPTIONAL `network`. The `intermediateDocument` SHOULD be a valid DID document
except all places where the DID document requires the use of the identifier
(e.g. the id field), this identifier SHOULD be the placeholder value
`did:btc1:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`.
The DID document SHOULD include at least one verificationMethod and service of
the type SingletonBeacon.

1. Set `idType` to "external".
1. Set `version` to `1`.
1. Set `network` to the desired network.
1. Set `genesisBytes` to the result of passing `intermediateDocument` into the
   [JSON Canonicalization and Hash] algorithm.
1. Pass `idType`, `version`, `network`, and `genesisBytes` to the [did:btc1
   Identifier Encoding](#didbtc1-identifier-encoding) algorithm, retrieving
   `id`.
1. Set `did` to `id`.
1. Set `initialDocument` to a copy of the `intermediateDocument`.
1. Replace all `did:btc1:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   values in the `initialDocument` with the `did`.
1. Optionally store `canonicalBytes` on a ::Content Addressable Storage:: (CAS)
   system like IPFS. If doing so, implementations MUST use ::CIDs:: generated following
   the IPFS v1 algorithm.
1. Return `did` and `initialDocument`.

### Read

The read operation is executed by a resolver after a resolution request identifying
a specific **did:btc1** `identifier` is received from a client at ::Resolution Time::.
The request MAY contain a `resolutionOptions` object containing additional information
to be used in resolution. The resolver then attempts to resolve the DID document
of the `identifier` at a specific ::Target Time::. The ::Target Time:: is either provided
in `resolutionOptions` or is set to the ::Resolution Time:: of the request.

To do so it executes the following algorithm:

1. Pass `identifier` to the [did:btc1 Identifier Decoding](#didbtc1-identifier-decoding)
   algorithm, retrieving `idType`, `version`, `network`, and `genesisBytes`.
1. Set `identifierComponents` to a map of `idType`, `version`, `network`, and `genesisBytes`.
1. Set `initialDocument` to the result of running the algorithm in
   [Resolve Initial Document] passing in the `identifier`, `identifierComponents`
   and `resolutionOptions`.
1. Set `targetDocument` to the result of running the algorithm in
   [Resolve Target Document] passing in `initialDocument` and `resolutionOptions`.
1. Return `targetDocument`.

#### Resolve Initial Document

This algorithm specifies how to resolve an initial DID document and validate
it against the `identifier` for a specific **did:btc1**. The algorithm takes as
inputs a **did:btc1** `identifier`, `identifierComponents` object and a
`resolutionsOptions` object. This algorithm returns a valid `initialDocument`
for that identifier.

1. If `identifierComponents.idType` value is "key", then set the `initialDocument`
   to the result of running the algorithm in
   [Deterministically Generate Initial DID Document] passing in the `identifier`
   and `identifierComponents` values.
1. Else If `identifierComponents.idType` value is "external", then set the
   `initialDocument` to the result of running [External Resolution] passing in
   the `identifier`, `identifierComponents` and `resolutionOptions` values.
1. Else MUST raise `invalidHRPValue` error.
1. Return `initialDocument`.

##### Deterministically Generate Initial DID Document

This algorithm deterministically generates an initial DID Document from a secp256k1
public key.
It takes in a **did:btc1** `identifier` and a `identifierComponents` object and
returns a `initialDocument`.

1. Set `keyBytes` to `identifierComponents.genesisBytes`.
1. Initialize a `initialDocument` variable as an empty object.
1. Set `initialDocument.id` to the `identifier`.
1. Initialize a `contextArray` to empty array:
    1. Append the DID Core context "https://www.w3.org/ns/did/v1".
    1. Append the Data Integrity context "https://w3id.org/security/data-integrity/v2".
    1. Append a **did:btc1** context.
    1. Set `initialDocument['@context]' to contextArray`.
1. Create an initial verification method:
    1. Initialize `verificationMethod` to an empty object.
    1. Set `verificationMethod.id` to "#initialKey".
    1. Set `verificationMethod.type` to "Multikey".
    1. Set `verificationMethod.controller` to `identifier`.
    1. Set `verificationMethod.publicKeyMultibase` to the result of the TODO:
       Multikey encoding algorithm passing in `keyBytes`.
1. Set `initialDocument.verificationMethod` to an array containing
   `verificationMethod`.
1. Initialize a `tempArray` variable to an array with the single element
   `verificationMethod.id`.
1. Set the `authentication`, `assertionMethod`, `capabilityInvocation`, and the
   `capabilityDelegation` properties in `initialDocument` to a copy of the `tempArray`
   variable.
1. Set the `initialDocument.services` property in `initialDocument` to the
   result of passing the `keyBytes` and `identifierComponents.network` to the
   [Deterministically Generate Beacon Services] algorithm.
1. Return `initialDocument`.

###### Deterministically Generate Beacon Services

This algorithm deterministically generates three ::Beacons:: from the single
`keyBytes` value used to generate the deterministic **did:btc1**, one for each
of the following three Bitcoin address types for the Bitcoin `network` specified
by the DID: Pay-to-Public-Key-Hash (P2PKH), Pay-to-Witness-Public-Key-Hash (P2WPKH),
and Pay-to-Taproot (P2TR). Spends from these three addresses can be produced only
through signatures from the `keyBytes`'s associated private key.
Each ::Beacon:: is of the type SingletonBeacon. The algorithm returns a `services` array.

1. Initialize a `services` variable to an empty array.
1. Set `serviceId` to `#initialP2PKH`.
1. Set `beaconAddress` to the result of generating a Pay-to-Public-Key-Hash Bitcoin
   address from the `keyBytes` for the appropriate `network`.
1. Set `p2pkhBeacon` to the result of passing `serviceId`, and
   `beaconAddress` to [Establish Singleton Beacon].
1. Push `p2pkhBeacon` to `services`.
1. Set `serviceId` to `#initialP2WPKH`.
1. Set `beaconAddress` to the result of generating a Pay-to-Witness-Public-Key-Hash
   Bitcoin address from the `keyBytes` for the appropriate `network`.
1. Set `p2wpkhBeacon` to the result of passing `serviceId`, and
   `beaconAddress` to [Establish Singleton Beacon].
1. Push `p2wpkhBeacon` to `services`.
1. Set `serviceId` to `#initialP2TR`.
1. Set `beaconAddress` to the result of generating a Pay-to-Taproot Bitcoin address
   from the `keyBytes` for the appropriate `network`.
1. Set `p2trBeacon` to the result of passing `serviceId`, and
   `beaconAddress` to [Establish Singleton Beacon].
1. Push `p2trBeacon` to `services`.
1. Return the `services` array.

##### External Resolution

This algorithm externally retrieves an `intermediateDocumentRepresentation`,
either by retrieving it from ::Content Addressable Storage:: (CAS) or from the
::Sidecar Data:: provided as part of the resolution request. The algorithm
takes in a **did:btc1** `identifier`, a `identifierComponents` object and a
`resolutionOptions` object.
It returns an `initialDocument`, which is a conformant DID document validated
against the `identifier`.

1. If `resolutionOptions.sidecarData.initialDocument` is not null, set
   `initialDocument` to the result of passing `identifier`, `identifierComponents`
   and `resolutionOptions.sidecarData.initialDocument` into algorithm
   [Sidecar Initial Document Validation].
1. Else set `initialDocument` to the result of passing `identifier` and
   `identifierComponents` to the [CAS Retrieval] algorithm.
1. Validate `initialDocument` is a conformant DID document according to the
   DID Core 1.1 specification. Else MUST raise `invalidDidDocument` error.
1. Return `initialDocument`.

###### Sidecar Initial Document Validation

This algorithm validates an `initialDocument` against its `identifier`,
by first constructing the `intermediateDocumentRepresentation` and verifying
the hash of this document matches the bytes encoded within the `identifier`.
The algorithm takes in a **did:btc1** `identifier`, `identifierComponents`
and a `initialDocument`. The algorithm returns the `initialDocument` if validated,
otherwise it throws an error.

1. Set `intermediateDocumentRepresentation` to a copy of the `initialDocument`.
1. Find and replace all values of `identifier` contained within the
   `intermediateDocumentRepresentation` with the string
   (`did:btc1:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`).
1. Set `hashBytes` to the SHA256 hash of the `intermediateDocumentRepresentation`.
1. If `hashBytes` does not equal `identifierComponents.genesisBytes` MUST throw an `invalidDid` error.
1. Return `initialDocument`.

###### CAS Retrieval

This algorithm attempts to retrieve an `initialDocument` from a ::Content
Addressable Storage:: (CAS) system by converting the bytes in the `identifier`
into a ::Content Identifier:: (CID). The algorithm takes in an `identifier` and an
`identifierComponents` object and returns an `initialDocument`.

1. Set `hashBytes` to `identifierComponents.genesisBytes`.
1. Set `cid` to the result of converting `hashBytes` to a IPFS v1 ::CID::.
1. Set `intermediateDocumentRepresentation` to the result of fetching the `cid`
   against a ::Content Addressable Storage:: (CAS) system such as IPFS.
1. Set `initialDocument` to the copy of the `intermediateDocumentRepresentation`.
1. Replace the string
   (`did:btc1:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`) with
   the `identifier` throughout the `initialDocument`.
1. Return `initialDocument`.

#### Resolve Target Document

This algorithm resolves a DID document from an initial document by walking the
Bitcoin blockchain to identify ::Beacon Signals:: that announce ::DID Update Payloads::
applicable to the **did:btc1** identifier being resolved. 

The algorithm takes as inputs:

- `initialDocument`: The DID document that was used to initiate the **did:btc1**
identifier being resolved as verified by the [Resolve Initial Document] algorithm.
A DID Core conformant DID document.
- `resolutionOptions`: A set of optional parameters passed in to the resolve function
of the DID resolver.
- `network`: The Bitcoin network of the **did:btc1** identifier.


The algorithm returns `targetDocument`, a DID Core conformant DID document or throws an error.

1. If `resolutionOptions.versionId` is not null, set `targetVersionId` to
   `resolutionOptions.versionId`.
1. Else if `resolutionOptions.versionTime` is not null, set `targetTime` to
   `resolutionOptions.versionTime`.
1. Else set `targetTime` to null and `targetVersionId` to null.
1. Set `targetBlockheight` to the result of passing `network` and `targetTime`  
   to the algorithm [Determine Target Blockheight].
1. Set `signalsMetadata` to `resolutionOptions.sidecarData.signalsMetadata`.
1. Set `currentVersionId` to 1.
1. If `currentVersionId` equals `targetVersionId` return `initialDocument`.
1. Set `updateHashHistory` to an empty array.
1. Set `contemporaryBlockheight` to 0.
1. Set `contemporaryDIDDocument` to the `initialDocument`.
1. Set `targetDocument` to the result of calling the [Traverse Blockchain History]
   algorithm passing in `contemporaryDIDDocument`, `contemporaryBlockheight`,
   `currentVersionId`, `targetVersionId`, `targetBlockheight`, `updateHashHistory`, 
   `signalsMetadata`, and `network`.
1. Return `targetDocument`.

##### Determine Target Blockheight

This algorithm determines the targetted Bitcoin blockheight that the resolution 
algorithm should traverse the blockchain history up to looking for 
for ::Beacon Signals::.

This algorithm takes the following inputs:

- `network`: A string identifying the Bitcoin network of the **did:btc1** identifier.
This algorithm MUST query the Bitcoin blockchain identified by the `network`.
- `targetTime`: Identifies a timestamp that the DID document should be resolved to.
If present, the value MUST be an ASCII string which is a valid XML datetime value.


The algorithm returns a Bitcoin `blockheight`.

1. If `targetTime`, find the Bitcoin `block` on the `network` with greatest `blockheight` 
   whose `timestamp` is less than the `targetTime`.
1. Else find the Bitcoin `block` with the greatest `blockheight` that has at
   least X conformations. TODO: what is X. Is it variable?
1. Set `blockheight` to `block.blockheight`.
1. Return `blockheight`.

##### Traverse Blockchain History

This algorithm traverses Bitcoin blocks, starting from the block with the
`contemporaryBlockheight`, to find `beaconSignals` emitted by ::Beacons:: within
the `contemporaryDIDDocument`. Each `beaconSignal` is processed to retrieve a
didUpdatePayload to the DID document. Each update is applied to the document and
duplicates are ignored. If the algorithm reaches the block with the blockheight
specified by a `targetBlockheight`, the `contemporaryDIDDocument` at that blockheight
is returned assuming a single canonical history of the DID document has been
constructed up to that point.

The algorithm takes the following inputs:

- `contemporaryDIDDocument`: The DID document for the **did:btc1** identifier 
   being resolved that is current at the blockheight of the `contemporaryBlockheight`. 
   A DID Core conformant DID document.
- `contemporaryBlockheight`: A Bitcoin blockheight identifying the contemporary time 
   at which the resolution algorithm has reached as it traverses each block in the 
   blockchain history. An integer greater of equal to 0. 
- `currentVersionId`: The version of the contemporaryDIDDocument. An integer starting from 
   1 and incrementing by 1 with each ::DID Update Payload:: applied to the DID document.
- `targetVersionId`: The version of the DID document that the resolution algorithm is attempting to resolve.
- `targetBlockheight`: The Bitcoin block at which the resolution algorithm stops
   traversing he blockchain history. Once `contemporaryBlockheight` equals the 
   `targetBlockheight` the algorithm with return the `contemporaryDIDDocument`.
- `updateHashHistory`: An ordered array of SHA256 hashes of ::DID Update Payloads:: 
   that have been applied to the DID document by the resolution algorithm in order 
   to construct the `contemporaryDIDDocument`.
- `signalsMetadata`: A Map from Bitcoin transaction identifiers of ::Beacon Signals:: 
   to a struct containing ::Sidecar Data:: for that signal provided as part of the
   resolutionOptions. This struct contains the following properties:
   - `updatePayload`: A ::DID Update Payload:: which should match the update announced
      by the ::Beacon Signal::. In the case of a ::SMT:: proof of non-inclusion no
      DID Update Payload may be provided.
   - `proofs`: A ::Sparse Merkle Tree:: proof that the provided `updatePayload` value is
      the value at the leaf indexed by the **did:btc1** being resolved. TODO: What exactly this
      structure is needs to be defined.
- `network`:  A string identifying the Bitcoin network of the **did:btc1** identifier.
This algorithm MUST query the Bitcoin blockchain identified by the `network`.


The algorithm returns the `contemporaryDIDDocument` once either the `targetBlockheight` or 
`targetVersionId` have been reached.

1. Set `contemporaryHash` to the result of passing `contemporaryDIDDocument` into the 
[JSON Canonicalization and Hash] algorithm.
1. Find all `beacons` in `contemporaryDIDDocument`: All `service` in
   `contemporaryDIDDocument.service` where `service.type` equals one of
   `SingletonBeacon`, `CIDAggregateBeacon` and `SMTAggregateBeacon` Beacon.
1. For each `beacon` in `beacons` convert the `beacon.serviceEndpoint` to a Bitcoin
   address following
   **[BIP21](https://github.com/bitcoin/bips/blob/master/bip-0021.mediawiki)**.
   Set `beacon.address` to the Bitcoin address.
1. Set `nextSignals` to the result of calling algorithm [Find Next Signals] passing 
   in `contemporaryBlockheight`, `targetBlockheight`, `beacons` and `network`.
1. Set `contemporaryBlockheight` to `nextSignals.blockheight`.
1. Set `signals` to `nextSignals.signals`.
1. Set `updates` to the result of calling algorithm
   [Process Beacon Signals] passing in `signals` and `signalsMetadata`.
1. Set `orderedUpdates` to the list of `updates` ordered by the `targetVersionId`
   property.
1. For `update` in `orderedUpdates`:
    1. If `update.targetVersionId` is less than or equal to `currentVersionId`,
       run Algorithm [Confirm Duplicate Update] passing in `update`,
       `updateHashHistory`, and `contemporaryHash`.
    1. If `update.targetVersionId` equals `currentVersionId + 1`:
        1.  Check that `update.sourceHash` equals `contemporaryHash`, else MUST
            raise `latePublishing` error.
        1.  Set `contemporaryDIDDocument` to the result of calling [Apply DID Update]
            algorithm passing in `contemporaryDIDDocument`, `update`.
        1.  Increment `currentVersionId`
        1.  If `currentVersionId` equals `targetVersionId` return
            `contemporaryDIDDocument`.
        1.  Set `updateHash` to the result of passing `update` into the [JSON Canonicalization and Hash]
            algorithm
        1.  Push `updateHash` onto `updateHashHistory`.
        1.  Set `contemporaryHash` to result of passing `contemporaryDIDDocument` into the 
            [JSON Canonicalization and Hash] algorithm.
    1.  If `update.targetVersionId` is greater than `currentVersionId + 1`, MUST
        throw a LatePublishing error.
1. If `contemporaryBlockheight` equals `targetBlockheight`, return `contemporaryDIDDocument`
1. Increment `contemporaryBlockheight`.
1. Set `targetDocument` to the result of calling the
   [Traverse Blockchain History] algorithm passing in `contemporaryDIDDocument`,
   `contemporaryBlockheight`, `currentVersionId`, `targetVersionId`,
   `targetBlockheight`, `updateHashHistory`, `signalsMetadata`, and `network`.
1. Return `targetDocument`.

##### Find Next Signals

This algorithm takes finds the next Bitcoin block containing ::Beacon Signals:: from one or more of the
`beacons` and retuns all ::Beacon Signals:: within that block.

This algorithm takes in the following inputs:

- `contemporaryBlockheight`: The height of the block this function is looking for 
   ::Beacon Signals:: in. An integer greater or equal to 0.
- `targetBlockheight`: The height of the Bitcoin block that the resolution algorithm 
   searches for ::Beacon Signals:: up to. An integer greater or equal to 0.
- `beacons`: An array of ::Beacon:: services in the ::contemporary DID document::.
   Each Beacon is a structure with the following properties:
    - `id`: The id of the Beacon service in the DID document. A string.
    - `type`: The type of the Beacon service in the DID document. A string whose values MUST be either SingletonBeacon, , CIDAggregateBeacon or SMTAggregateBeacon.
    - `serviceEndpoint`: A BIP21 URI representing a Bitcoin address.
    - `address`: The Bitcoin address decoded from the `serviceEndpoint value.
- `network`: A string identifying the Bitcoin network of the **did:btc1** identifier.
This algorithm MUST query the Bitcoin blockchain identified by the `network`.
  

This algorithm returns a `nextSignals` struct, containing the following properties:
- `blockheight`: The Bitcoin blockheight for the block containing the ::Beacon Signals::.
- `signals`: An array of `signals`. Each `signal` is a struct containing the following:
   - `beaconId`: The id for the ::Beacon:: that the `signal` was announced by.
   - `beaconType`: The type of the ::Beacon:: that announced the `signal`.
   - `tx`: The Bitcoin transaction that is the ::Beacon Signal::.

1. Set `signals` to an empty array.
1. Get Bitcoin `block` at `contemporaryBlockheight`.
1. For all `txid` in `block.tx`:
   1. Ignore the coinbase and genesis transaction identifiers. Coinbase tx identifiers are
   `0000000000000000000000000000000000000000000000000000000000000000` and the genesis tx
   identifier is `4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b`.
   1. Set `tx` to the result of fetching the Bitcoin transaction with the `txid`.
   1. For each `tx_in` in the set of transaction inpurs for `tx`:
      1. Set `prev_tx_id` to transaction identifier spent in the `tx_in`
      1. Ignore coinbase transaction identifiers 
      1. Set `prev_tx` to the result of fetch the transaction with the `prev_tx_id`
      1. Set `spent_tx_out` to transaction output of `prev_tx` indexed by the `tx_in.prev_index`
      1. Set `spent_address` to the script pubkey address for the `spent_tx_out` for the provided `network`.
      1. If `spent_address` equals any of the `address` fields of the provided `beacons` array:
         1. Set `beaconSignal` to an object containing the following fields object:
            ```{.json include="json/CRUD-Operations/Read-find-next-signals-tx.json"}
            ```
         1. Push `beaconSignal` onto the `signals` array.
         1. Break the loop, transaction is a ::Beacon Signal::, no need to check additional transaction inputs.
1. If `contemporaryBlockheight` equals `targetBlockheight`, return a `nextSignals` struct: 
   ```{.json include="json/CRUD-Operations/Read-initialize-next-signals.json"}
   ```
1. If no `signals`, set `nextSignals` to the result of algorithm
[Find Next Signals] passing in `contemporaryBlockheight + 1`, `beacons`, and `network`.
1. Else initialize a `nextSignals` object to the following:
   ```{.json include="json/CRUD-Operations/Read-initialize-next-signals.json"}
   ```
1. Return `nextSignals`.

##### Process Beacon Signals

This algorithm processes each ::Beacon Signal:: by attempting to retrieve and validate an announce 
::DID Update Payload:: for that signal according to the type of the ::Beacon::.

This algorithm takes as inputs:

- `beaconSignals`: An array of struct representing ::Beacon Signals:: retrieved through executing
the [Find Next Signals] algorithm. Each struct contains the follow properties:
   - `beaconId`: The id for the ::Beacon:: that the `signal` was announced by.
   - `beaconType`: The type of the ::Beacon:: that announced the `signal`.
   - `tx`: The Bitcoin transaction that is the ::Beacon Signal::.
- `signalsMetadata`: A Map from Bitcoin transaction identifiers of ::Beacon Signals:: 
   to a struct containing ::Sidecar Data:: for that signal provided as part of the
   resolutionOptions. This struct contains the following properties:
   - `updatePayload`: A ::DID Update Payload:: which should match the update announced
      by the ::Beacon Signal::. In the case of a ::SMT:: proof of non-inclusion no
      DID Update Payload may be provided.
   - `proofs`: A ::Sparse Merkle Tree:: proof that the provided `updatePayload` value is
      the value at the leaf indexed by the **did:btc1** being resolved. TODO: What exactly this
      structure is needs to be defined.

The algorithm returns an array of ::DID Update Payloads::.


1. Set `updates` to an empty array.
1. For `beaconSignal` in `beaconSignals`:
    1. Set `type` to `beaconSignal.beaconType`.
    1. Set `signalTx` to `beaconSignal.tx`.
    1. Set `signalId` to `signalTx.id`.
    1. Set `signalSidecarData` to `signalsMetadata[signalId]`. TODO: formalize
       structure of sidecarData
   1. Set `didUpdatePayload` to null.
   1. If `type` == `SingletonBeacon`:
      1. Set `didUpdatePayload` to the result of passing `signalTx` and   
        `signalSidecarData` to the [Process Singleton Beacon Signal] algorithm.
   1. If `type` == `CIDAggregateBeacon`:
      1. Set `didUpdatePayload` to the result of passing `signalTx` and   
        `signalSidecarData` to the [Process CIDAggregate Beacon Signal] algorithm.
   1. If `type` == `SMTAggregateBeacon`:
      1. Set `didUpdatePayload` to the result of passing `signalTx` and   
        `signalSidecarData` to the [Process SMTAggregate Beacon Signal] algorithm.
    1. If `didUpdatePayload` is not null, push `didUpdatePayload` to `updates`.
1. Return `updates`.

##### Confirm Duplicate Update

This algorithm takes in a ::DID Update Payload:: and verifies that the update is a
duplicate against the hash history of previously applied updates.
The algorithm takes in an `update` and an array of hashes, `updateHashHistory`.
It throws an error if the `update` is not a duplicate, otherwise it returns.
TODO: does this algorithm need  `contemporaryHash` passed in?

1. Let `updateHash` equal the result of passing `update` into the [JSON Canonicalization and Hash] algorithm.
1. Let `updateHashIndex` equal `update.targetVersionId - 2`.
1. Let `historicalUpdateHash` equal `updateHashHistory[updateHashIndex]`.
1. Assert `historicalUpdateHash` equals `updateHash`, if not MUST throw a
   LatePublishing error.
1. Return

##### Apply DID Update

This algorithm attempts to apply a DID Update to a DID document, it first
verifies the proof on the update is a valid capabilityInvocation of the root
authority over the DID being resolved. Then it applies the JSON patch
transformation to the DID document, checks the transformed DID document
matches the targetHash specified by the update and validates it is a conformant
DID document before returning it. This algorithm takes inputs
`contemporaryDIDDocument` and an `update`.

1. Set `capabilityId` to `update.proof.capability`.
1. Set `rootCapability` to the result of passing `capabilityId` to the [Dereference Root Capability Identifier] algorithm.
1. If `rootCapability.invocationTarget` does not equal `contemporaryDIDDocument.id` and `rootCapability.controller` 
   does not equal  `contemporaryDIDDocument.id`, MUST throw an `invalidDidUpdate` error.
1. Instantiate a `schnorr-secp256k1-2025` `cryptosuite` instance.
1. Set `expectedProofPurpose` to `capabilityInvocation`.
1. Set `mediaType` to ???? TODO: is this just `application/json`?
1. Set `documentBytes` to the bytes representation of `update`.
1. Set `verificationResult` to the result of passing `mediaType`, `documentBytes`,
   `cryptosuite`, and `expectedProofPurpose` into the
   [Verify Proof algorithm](https://w3c.github.io/vc-data-integrity/#verify-proof)
   defined in the VC Data Integrity specification.
1. If `verificationResult.verified` equals False, MUST raise a `invalidUpdateProof` exception.
1. Set `targetDIDDocument` to a copy of `contemporaryDIDDocument`.
1. Use JSON Patch to apply the `update.patch` to the `targetDIDDOcument`.
1. Verify that `targetDIDDocument` is conformant with the data model specified
   by the DID Core specification.
1. Set `targetHash` to the result of passing `targetDIDDocument` to the [JSON Canonicalization and Hash] algorithm.
1. Check that `targetHash` equals the base58 decoded `update.targetHash`, else raise InvalidDidUpdate
   error.
1. Return `targetDIDDocument`.

### Update

An update to a **did:btc1** document is an invoked capability using the ZCAP-LD
data format, signed by a verificationMethod that has the authority to make the
update as specified in the previous DID document. Capability invocations for
updates MUST be authorized using Data Integrity following the schnorr-secp256k1-jcs-2025
cryptosuite with a proofPurpose of `capabilityInvocation`.

This algorithm takes as inputs a `btc1Identifier`, `sourceDocument`,
`sourceVersionId`, `documentPatch`, a `verificationMethodId`, and an array
of `beaconIds`. The `sourceDocument` is the DID document being updated. The
`documentPatch` is a JSON Patch object containing a set of transformations to
be applied to the `sourceDocument`. The result of these transformations MUST
produce a DID document conformant to the DID Core specification. The
`verificationMethodId` is an identifier for a verificationMethod within the
`sourceDocument`. The verificationMethod identified MUST be a Schnorr secp256k1
Multikey. The `beaconIds` MUST identify service endpoints with one of the
three ::Beacon Types:: `SingletonBeacon`, `CIDAggregateBeacon`, and
`SMTAggregateBeacon`.

1. Set `unsignedUpdate` to the result of passing `btc1Identifier`, `sourceDocument`,
   `sourceVersionId`, and `documentPatch` into the [Construct DID Update Payload]
   algorithm.
1. Set `verificationMethod` to the result of retrieving the verificationMethod from
   `sourceDocument` using the `verificationMethodId`.
1. Validate the `verificationMethod` is a Schnorr secp256k1 Multikey:
    1. `verificationMethod.type` == `Multikey`
    1. `verificationMethod.publicKeyMultibase[4]` == `z66P`
1. Set `didUpdateInvocation` to the result of passing `btc1Identifier`,
   `unsignedUpdate` as `didUpdatePayload, `and `verificationMethod` to the
   [Invoke DID Update Payload] algorithm.
1. Set `signalsMetadata` to the result of passing `btc1Identifier`, `sourceDocument`, 
   `beaconIds` and `didUpdateInvocation` to the [Announce DID Update] algorithm.
1. Return `signalsMetadata`. It is up to implementations to ensure that the
   `signalsMetadata` is persisted.

#### Construct DID Update Payload

This algorithm takes in a `btc1Identifier`, `sourceDocument`, `sourceVersionId`,
and `documentPatch` objects. It applies the `documentPatch` to the `sourceDocument`
and verifies the resulting `targetDocument` is a conformant DID document. Then
it constructs and returns an unsigned ::DID Update Payload::.

1. Check that `sourceDocument.id` equals `btc1Identifier` else MUST raise
   `invalidDidUpdate` error.
1. Initialize `didUpdatePayload` to an empty object.
1. Set `didUpdatePayload.@context` to the following list // TODO: Need to add btc1 context.
   `["https://w3id.org/zcap/v1", "https://w3id.org/security/data-integrity/v2", 
   "https://w3id.org/json-ld-patch/v1"]`
1. Set `didUpdatePayload.patch` to `documentPatch`.
1. Set `targetDocument` to the result of applying the `documentPatch` to the
   `sourceDocument`, following the JSON Patch specification.
1. Validate `targetDocument` is a conformant DID document, else MUST raise
   `invalidDidUpdate` error.
1. Set `sourceHashBytes` to the result of passing `sourceDocument` into
   the [JSON Canonicalization and Hash] algorithm.
1. Set `didUpdatePayload.sourceHash` to the base58-btc Multibase encoding
   of `sourceHashBytes`. // Question: is base58btc the correct encoding scheme?
1. Set `targetHashBytes` to the result of passing `targetDocument` into
   the [JSON Canonicalization and Hash] algorithm.
1. Set `didUpdatePayload.targetHash` to the base58-btc Multibase encoding
   of `targetHashBytes`.
1. Set `didUpdatePayload.targetVersionId` to `sourceVersionId + 1`
1. Return `didUpdatePayload`.

#### Invoke DID Update Payload

This algorithm takes in a `btc1Identifier`, an unsigned `didUpdatePayload`, and a
`verificationMethod`. The algorithm retrieves the `privateKeyBytes` for the
`verificationMethod` and adds a capability invocation in the form of a Data
Integrity proof following the Authorization Capabilities (ZCAP-LD) and
VC Data Integrity specifications.

The algorithm returns the invoked ::DID Update Payload::.

1. Set `privateKeyBytes` to the result of retrieving the private key bytes
   associated with the `verificationMethod` value. How this is achieved is left to
   the implementation.
1. Set `rootCapability` to the result of passing `btc1Identifier` into the
   [Derive Root Capability from **did:btc1** Identifier] algorithm.
1. Initialize `proofOptions` to an empty object.
1. Set `proofOptions.type` to `DataIntegrityProof`.
1. Set `proofOptions.cryptosuite` to `schnorr-secp256k1-jcs-2025`.
1. Set `proofOptions.verificationMethod` to `verificationMethod.id`.
1. Set `proofOptions.proofPurpose` to `capabilityInvocation`.
1. Set `proofOptions.capability` to `rootCapability.id`.
1. Set `proofOptions.capabilityAction` to `Write`. // Wonder if we actually need this.
   Aren't we always writing.
1. Set `cryptosuite` to the result of executing the Cryptosuite Instantiation
   algorithm from the Schnorr secp256k1 Data Integrity specification passing in
   `proofOptions`.
1. // TODO: need to set up the proof instantiation such that it can resolve
   / dereference the root capability. This is deterministic from the DID.
1. Set `didUpdateInvocation` to the result of executing the
   [Add Proof](https://www.w3.org/TR/vc-data-integrity/#add-proof)
   algorithm from VC Data Integrity passing `didUpdatePayload` as the input document,
   `cryptosuite`, and the set of `proofOptions`.
1. Return `didUpdateInvocation`.

#### Announce DID Update

This algorithm takes in a `btc1Identifier`, `sourceDocument`, an array of `beaconIds`, 
and a `didUpdateInvocation`. It retrieves `beaconServices` from the `sourceDocument`
and calls the Broadcast DID Update algorithm corresponding to the type of
the ::Beacon::. The algorithm returns an array of `signalsMetadata`, containing the
necessary data to validate the ::Beacon Signal:: against the `didUpdateInvocation`.

1. Set `beaconServices` to an empty array.
1. Set `signalMetadata` to an empty array.
1. For `beaconId` in `beaconIds`:
   1. Find `beaconService` in `sourceDocument.service` with an `id` property
    equal to `beaconId`.
   1. If no `beaconService` MUST throw `beaconNotFound` error.
   1. Push `beaconService` to `beaconServices`.
1. For `beaconService` in `beaconServices`:
   1. Set `signalMetadata` to null.
   1. If `beaconService.type` == `SingletonBeacon`:
      1. Set `signalMetadata` to the result of
        passing `beaconService` and `didUpdateInvocation` to the
        [Broadcast Singleton Beacon Signal] algorithm.
   1. Else If `beaconService.type` == `CIDAggregateBeacon`:
      1. Set `signalMetadata` to the result of
        passing `btc1Identifier`, `beaconService` and `didUpdateInvocation` to the
        [Broadcast CIDAggregate Beacon Signal] algorithm.
   1. Else If `beaconService.type` == `SMTAggregateBeacon`:
      1. Set `signalMetadata` to the result of
        passing `btc1Identifier`, `beaconService` and `didUpdateInvocation` to the
        [Broadcast SMTAggregate Beacon Signal] algorithm.
   1. Else:
      1. MUST throw `invalidBeacon` error.
  1. Merge `signalMetadata` into `signalsMetadata`.

1. Return `signalsMetadata`.



### Deactivate

To deactivate a **did:btc1**, the DID controller MUST add the property `deactivated`
with the value `true` on the DID document. To do this, the DID controller constructs
a valid ::DID Update Payload:: with a JSON patch that adds this property and announces
the payload through a ::Beacon:: in their current DID document following the algorithm
in [Update]. Once a **did:btc1** has been deactivated this
state is considered permanent and resolution MUST terminate.
