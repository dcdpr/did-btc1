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

1. Set `genesisBytes` to `pubKeyBytes`.
1. Set `idType` to "key".
1. Set `did` to the result of [did:btc1 Identifier Construction] passing`idType` and
   `genesisBytes` and passing `version` and `network` if set.
1. Set `initialDocument` to the result of passing `did` into the [Read] algorithm.
1. Return `did` and `initialDocument`.

#### External Initial Document Creation

It is possible to create a **did:btc1** from some initiating arbitrary DID document.
This allows for more complex initial DID documents, including the ability to include
Service Endpoints and Beacons that support aggregation.

The algorithm takes in an `intermediateDocument` struct, an OPTIONAL `version`,
and an OPTIONAL `network`. The `intermediateDocument` SHOULD be a valid DID document
except all places where the DID document requires the use of the identifier
(e.g. the id field), this identifier SHOULD be the placeholder value
`did:btc1:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`.
The DID document SHOULD include at least one verificationMethod and service of
the type SingletonBeacon.

1. Set `idType` to "external".
1. Set `genesisBytes` to the result of passing `intermediateDocument` into the
   [JSON Canonicalization and Hash] algorithm.
1. Set `did` to the result of [did:btc1 Identifier Construction] passing `idType` and `genesisBytes` and
   passing `version` and `network` if set.
1. Set `initialDocument` to a copy of the `intermediateDocument`.
1. Replace all `did:btc1:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   values in the `initialDocument` with the `did`.
1.  Optionally store `canonicalBytes` on a Content Addressable Storage (CAS)
    system like IPFS. If doing so, implementations MUST use CIDs generated following
    the IPFS v1 algorithm.
1. Return `did` and `initialDocument`.

#### did:btc1 Identifier Construction

A macro or convenience function can be used to construct **did:btc1** identifiers.
The algorithm takes two REQUIRED inputs: `idType` and `genesisBytes`, and
two OPTIONAL inputs: `version` and `network`. If `idType` is "key", then `genesisBytes`
is a compressed SEC encoded secp256k1 public key. If `idType` is "external",
then `genesisBytes` is the byte representation of a SHA256 hash of a genesis
intermediate DID document.

1. Initialize `result` to the **did:btc1** prefix string `"did:btc1:"`.
1. If `version` is not null, append `version` and `":"` to `result`.
1. If `network` is not null, append `network` and `":"` to `result`.
1. If `idType` is "key", append the result of the
   [Bech32 Encoding a secp256k1 Public Key] algorithm, passing `genesisBytes`.
1. Else if `idType` is "external",  append the result of the
   [Bech32 encoding a hash-value] algorithm, passing `genesisBytes`.
1. Else, MUST raise "InvalidDID" exception.
1. Return `result`.

### Read

The read operation is executed by a resolver after a resolution request identifying
a specific **did:btc1** `identifier` is received from a client at Resolution Time.
The request MAY contain a `resolutionOptions` object containing additional information
to be used in resolution. The resolver then attempts to resolve the DID document
of the `identifier` at a specific Target Time. The Target Time is either provided
in `resolutionOptions` or is set to the Resolution Time of the request.

To do so it executes the following algorithm:

1. Let `identifierComponents` be the result of running the algorithm in
   [Parse **did:btc1** identifier], passing in the `identifier`.
1. Set `initialDocument` to the result of running the algorithm in
   [Resolve Initial Document] passing in the `identifier`, `identifierComponents`
   and `resolutionOptions`.
1. Set `targetDocument` to the result of running the algorithm in
   [Resolve Target Document] passing in `initialDocument` and `resolutionOptions`.
1. Return `targetDocument`.

#### Parse **did:btc1** Identifier

The following algorithm specifies how to parse a **did:btc1** identifier according
to the syntax defined in [Syntax]. REQUIRED input is a DID identifier.
This algorithm returns an `identifierComponents` structure whose items are:

- network
- version
- hrp
- genesisBytes

1. Set `identifierComponents` to an empty object.
1. Using a colon (`:`) as the delimiter, split the `identifier` into an array of
   `components`.
1. Set `scheme` to `components[0]`.
1. Set `methodId` to `components[1]`.
1. If the length of `components` equals `3`, set `identifierComponents.version`
   to `1` and `identifierComponents.network` to `mainnet`. Set `idBech32` to
   `components[2]`.
1. Else if length of `components` equals `4`, check if `components[2]` can be cast
   to an integer. If so, set `identifierComponents.version` to `components[2]` and
   `identifierComponents.network` to `mainnet`. Otherwise, set
   `identifierComponents.network` to `components[2]` and `identifierComponents.version`
   to `1`. Set `idBech32` to `components[3]`.
1. Else if the length of `components` equals `5`, set `identifierComponents.version`
   to `components[2]`, `identifierComponents.network` to `components[3]` and `idBech32`
   to the `components[4]`.
1. Else MUST raise `InvalidDID` error. There are an incorrect number of components
   to the `identifier`.
1. Check the validity of the identifier components. The `scheme` MUST be the value
   `did`. The `methodId` MUST be the value `btc1`. The `identifierComponents.version`
   MUST be convertible to a positive integer value. The `identifierComponents.network`
   MUST be one of `mainnet`, ` signet`, `testnet`, or `regnet`. If any of these
   requirements fail then an `InvalidDID` error MUST be raised.
1. Decode `idBech32` using the Bech32 algorithm to get `decodeResult`.
1. Set `identifierComponents.hrp` to `decodeResult.hrp`.
1. Set `identifierComponents.genesisBytes` to `decodeResult.value`.
1. Return `identifierComponents`.

#### Resolve Initial Document

This algorithm specifies how to resolve an initial DID document and validate
it against the `identifier` for a specific **did:btc1**. The algorithm takes as
inputs a **did:btc1** `identifier`, `identifierComponents` object and a
`resolutionsOptions` object. This algorithm returns a valid `initialDocument`
for that identifier.

1. If `identifierComponents.hrp` value is `k`, then set the `initialDocument`
   to the result of running the algorithm in
   [Deterministically Generate Initial DID Document] passing in the `identifier`,
   `identifierComponents` values.
1. Else If `decodeResult.hrp` value is `x`, then set the `initialDocument` to
   the result of running [External Resolution] passing in the `identifier`,
   `identifierComponents` and `resolutionOptions` values.
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

This algorithm deterministically generates three Beacons from the single
`keyBytes` value used to generate the deterministic **did:btc1**, one for each
of the following three Bitcoin address types for the Bitcoin `network` specified
by the DID: Pay-to-Public-Key-Hash (P2PKH), Pay-to-Witness-Public-Key-Hash (P2WPKH),
and Pay-to-Taproot (P2TR). Spends from these three addresses can be produced only
through signatures from the `keyBytes`'s associated private key.
Each Beacon is of the type SingletonBeacon. The algorithm returns a `services` array.

1. Initialize a `services` variable to an empty array.
1. Set `beaconType` to `SingletonBeacon`.
1. Set `serviceId` to `#initialP2PKH`.
1. Set `beaconAddress` to the result of generating a Pay-to-Public-Key-Hash Bitcoin
   address from the `keyBytes` for the appropriate `network`.
1. Set `p2pkhBeacon` to the result of passing `serviceId`, `beaconType`, and
   `beaconAddress` to [Create Beacon Service].
1. Push `p2pkhBeacon` to `services`.
1. Set `serviceId` to `#initialP2WPKH`.
1. Set `beaconAddress` to the result of generating a Pay-to-Witness-Public-Key-Hash
   Bitcoin address from the `keyBytes` for the appropriate `network`.
1. Set `p2wpkhBeacon` to the result of passing `serviceId`, `beaconType`, and
   `beaconAddress` to [Create Beacon Service].
1. Push `p2wpkhBeacon` to `services`.
1. Set `serviceId` to `#initialP2TR`.
1. Set `beaconAddress` to the result of generating a Pay-to-Taproot Bitcoin address
   from the `keyBytes` for the appropriate `network`.
1. Set `p2trBeacon` to the result of passing `serviceId`, `beaconType`, and
   `beaconAddress` to [Create Beacon Service].
1. Push `p2trBeacon` to `services`.
1. Return the `services` array.

###### Create Beacon Service

// TODO: This is a generic algorithm. Perhaps move to appendix.

This algorithm creates a Beacon service that can be included into the services
array of a DID document.
The algorithm takes in a `serviceId`, a Beacon Type, `beaconType`, and a
`bitcoinAddress`. It returns a `service` object.

1. Initialize a `beacon` variable to an empty object.
1. Set `beacon.id` to `serviceId`.
1. Set `beacon.type` to `beaconType`.
1. Set `beacon.serviceEndpoint` to the result of converting `bitcoinAddress` to
   a URI as per **[BIP21](https://github.com/bitcoin/bips/blob/master/bip-0021.mediawiki)**
1. Return `beacon`.

##### External Resolution

This algorithm externally retrieves an `intermediateDocumentRepresentation`,
either by retrieving it from Content Addressable Storage (CAS) or from the Sidecar
data provided as part of the resolution request. The algorithm takes in a
**did:btc1** `identifier`, a `identifierComponents` object and a
`resolutionOptions` object.
It returns an `initialDocument`, which is a conformant DID document validated
against the `identifier`.

1. If `resolutionOptions.sidecarData.genesisDocument` is not null, set
   `initialDocument` to the result of passing `identifier`, `identifierComponents`
   and `resolutionOptions.sidecarData.initialDocument` into algorithm
   [Sidecar Initial Document Validation].
1. Else set `initialDocument` to the result of passing `identifier` and
   `identifierComponents` to the [CAS Retrieval] algorithm.
1. Validate `initialDocument` is a conformant DID document according to the
   DID Core 1.1 specification.
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
1. If `hashBytes` does not equal `identifierComponents.genesisBytes` MUST throw an `invalidDID` error.
1. Return `initialDocument`.

###### CAS Retrieval

This algorithm attempts to retrieve an `initialDocument` from a Content
Addressable Storage (CAS) system by converting the bytes in the `identifier`
into a Content Identifier (CID). The algorithm takes in an `identifier` and an
`identifierComponents` object and returns an `initialDocument`.

1. Set `hashBytes` to `identifierComponents.genesisBytes`.
1. Set `cid` to the result of converting `hashBytes` to a IPFS v1 CID.
1. Set `intermediateDocumentRepresentation` to the result of fetching the `cid`
   against a Content Addressable Storage (CAS) system such as IPFS.
1. Set `initialDocument` to the copy of the `intermediateDocumentRepresentation`.
1. Replace the string
   (`did:btc1:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`) with
   the `identifier` throughout the `initialDocument`.
1. Return `initialDocument`.

#### Resolve Target Document

This algorithm resolves a DID document from an initial document by walking the
Bitcoin blockchain to identify Beacon Signals that announce DID Update Payloads
applicable to the **did:btc1** identifier being resolved. The algorithm takes
in an `initialDocument` and a set of `resolutionOptions`. The algorithm returns
a valid `targetDocument` or throws an error.

1. If `resolutionOptions.versionId` is not null, set `targetVersionId` to
   `resolutionOptions.versionId`.
1. Else if `resolutionOptions.versionTime` is not null, set `targetTime` to
   `resolutionOptions.versionTime`.
1. Set `targetBlockheight` to the result of passing `targetTime` to the algorithm
   [Determine Target Blockheight].
1. Set `sidecarData` to `resolutionOptions.sidecarData`.
1. Set `currentVersionId` to 1.
1. If `currentVersionId` equals `targetVersionId` return `initialDocument`.
1. Set `updateHashHistory` to an empty array.
1. Set `contemporaryBlockheight` to 0.
1. Set `contemporaryDIDDocument` to the `initialDocument`.
1. Set `targetDocument` to the result of calling the [Traverse Blockchain History]
   algorithm passing in `contemporaryDIDDocument`, `contemporaryBlockheight`,
   `currentVersionId`, `targetVersionId`, `targetBlockheight`, `updateHashHistory`, 
   and `sidecarData`.
1. Return `targetDocument`.

##### Determine Target Blockheight

This algorithm takes in an OPTIONAL Unix `targetTime` and returns a Bitcoin
`blockheight`.

1. If `targetTime`, find the Bitcoin `block` with greatest `blockheight` whose
   `timestamp` is less than the `targetTime`.
1. Else find the Bitcoin `block` with the greatest `blockheight` that has at
   least X conformations. TODO: what is X. Is it variable?
1. Set `blockheight` to `block.blockheight`.
1. Return `blockheight`.

##### Traverse Blockchain History

This algorithm traverse Bitcoin blocks, starting from the block with the
`contemporaryBlockheight`, to find `beaconSignals` emitted by Beacons within
the `contemporaryDIDDocument`. Each `beaconSignal` is processed to retrieve a
didUpdatePayload to the DID document. Each update is applied to the document and
duplicates are ignored. If the algorithm reaches the block with the blockheight
specified by a `targetBlockheight`, the `contemporaryDIDDocument` at that blockheight
is returned assuming a single canonical history of the DID document has been
constructed up to that point.

The algorithm takes as inputs a `contemporaryDIDDocument`, a `contemporaryBlockheight`,
a `currentVersionId`, a `targetVersionId`, a `targetBlockheight`, an array of
`updateHashHistory`, and a set of `sidecarData`.

The algorithm returns a DID document.

1. Set `contemporaryHash` to the SHA256 hash of the `contemporaryDIDDocument`.
   TODO: NEED TO DEAL WITH CANONICALIZATION
1. Find all `beacons` in `contemporaryDIDDocument`: All `service` in
   `contemporaryDIDDocument.services` where `service.type` equals one of
   `SingletonBeacon`, `CIDAggregateBeacon` and `SMTAggregateBeacon` Beacon.
1. For each `beacon` in `beacons` convert the `beacon.serviceEndpoint` to a Bitcoin
   address following
   **[BIP21](https://github.com/bitcoin/bips/blob/master/bip-0021.mediawiki)**.
   Set `beacon.address` to the Bitcoin address.
1. Set `nextSignals` to the result of calling algorithm
   [Find Next Signals] passing in `contemporaryBlockheight` and `beacons`.
1. If `nextSignals.blockheight` is greater than `targetBlockheight` return
   `contemporaryDIDDocument`.
1. Set `signals` to `nextSignals.signals`.
1. Set `updates` to the result of calling algorithm
   [Process Beacon Signals] passing in `signals` and `sidecarData`.
1. Set `orderedUpdates` to the list of `updates` ordered by the `targetVersionId`
   property.
1. For `update` in `orderedUpdates`:
    1. If `update.targetVersionId` is less than or equal to `currentVersionId`,
       run Algorithm [Confirm Duplicate Update] passing in `update`,
       `documentHistory`, and `contemporaryHash`.
    1. If `update.targetVersionId` equals `currentVersionId + 1`:
        1.  Check that `update.sourceHash` equals `contemporaryHash`, else MUST
            raise LatePublishing error.
        1.  Set `contemporaryDIDDocument` to the result of calling [Apply DID Update]
            algorithm passing in `contemporaryDIDDocument`, `update`.
        1.  Increment `currentVersionId`
        1.  If `currentVersionId` equals `targetVersionId` return
            `contemporaryDIDDocument`.
        1.  Set `updateHash` to the sha256 hash of the `update`.
        1.  Push `updateHash` onto `updateHashHistory`.
        1.  Set `contemporaryHash` to the SHA256 hash of the
            `contemporaryDIDDocument`.
    1.  If `update.targetVersionId` is greater than `currentVersionId + 1`, MUST
        throw a LatePublishing error.
1. Increment `contemporaryBlockheight`.
1. Set `targetDocument` to the result of calling the
   [Traverse Blockchain History] algorithm passing in `contemporaryDIDDocument`,
   `contemporaryBlockheight`, `currentVersionId`, `targetVersionId`,
   `targetBlockheight`, `documentHistory`, and `sidecarData`.
1. Return `targetDocument`.

##### Find Next Signals

This algorithm takes in a `contemporaryBlockheight` and a set of `beacons` and
finds the next Bitcoin block containing Beacon Signals from one or more of the
`beacons`.

This algorithm takes as inputs a Bitcoin blockheight specified by
`contemporaryBlockheight` and an array of `beacons`.

This algorithm returns a `nextSignals` struct, containing a `blockheight`
the signals were found in and an array of `signals`. Each `signal` is a struct
containing `beaconId`, `beaconType`, and `tx` properties.

1. Get Bitcoin `block` at `contemporaryBlockheight`.
1. Set `beaconSignals` to an empty array.
1. For all `tx` in `block.txs`:
   check to see if any transaction inputs are spends from one of the Beacon addresses.
   If they are, create a `signal` object containing the following fields and push
   `signal` to `beaconSignals`:
```
{
    "beaconId": `beaconService.id`,
    "beaconType": `beaconService.type`,
    "tx": `tx`
}
```
4. If no `beaconSignals`, set `nextSignals` to the result of algorithm
   [Find Next Signals] passing in `contemporaryBlockheight + 1` and `beacons`.
5. Else initialize a `nextSignals` object to the following:
```
{
  "blockheight": `block.blockheight`,
  "signals": `beaconSignals`
}
```
6. Return `nextSignals`.

##### Process Beacon Signals

This algorithm takes in an array of struct `beaconSignals` and attempts
to process these signals according the type of the Beacon they were produced by.
Each `beaconSignal` struct contains the properties `beaconId`, `beaconType`, and
a `tx`. Additionally, this algorithm takes in `sidecarData` passed into the
resolver through the `resolutionOptions`. If `sidecarData` is present it is used
to process the Beacon Signals.

1. Set `updates` to an empty array.
1. For `beaconSignal` in `beaconSignals`:
    1. Set `type` to `beaconSignal.beaconType`.
    1. Set `signalTx` to `beaconSignal.tx`.
    1. Set `signalId` to `signalTx.id`.
    1. Set `signalSidecarData` to `sidecarData[signalId]`. TODO: formalize
       structure of sidecarData
    1. Set `didUpdatePayload` to the result of passing `signalTx` and
       `signalSidecarData` to the Process Beacon Signal algorithm defined by the
       corresponding Beacon `type`. See [Update Beacons].
    1. If `didUpdatePayload` is not null, push `didUpdatePayload` to `updates`.
1. Return `updates`.

##### Confirm Duplicate Update

This algorithm takes in a DID Update Payload and verifies that the update is a
duplicate against the hash history of previously applied updates.
The algorithm takes in an `update` and an array of hashes, `updateHashHistory`.
It throws an error if the `update` is not a duplicate, otherwise it returns.
TODO: does this algorithm need  `contemporaryHash` passed in?

1. Let `updateHash` equal the SHA256 hash of the `update`.
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

1. Instantiate a `schnorr-secp256k1-2025` `cryptosuite` instance.
1. Set `expectedProofPurpose` to `capabilityInvocation`.
1. Set `mediaType` to ???? TODO
1. Set `documentBytes` to the bytes representation of `update`.
1. Set `verificationResult` to the result of passing `mediaType`, `documentBytes`,
   `cryptosuite`, and `expectedProofPurpose` into the
   [Verify Proof algorithm](https://w3c.github.io/vc-data-integrity/#verify-proof)
   defined in the VC Data Integrity specification.
1. TODO: HOW DO WE ENSURE THAT THE PROOF IS A VALID INVOCATION OF THE ROOT
   CAPABILITY derived using [Derive Root Capability from **did:btc1** Identifier]
   algorithm
1. Set `targetDIDDocument` to a copy of `contemporaryDIDDocument`.
1. Use JSON Patch to apply the `update.patch` to the `targetDIDDOcument`.
1. Verify that `targetDIDDocument` is conformant with the data model specified
   by the DID Core specification.
1. Set `targetHash` to the SHA256 hash of `targetDIDDocument`.
1. Check that `targetHash` equals `update.targetHash`, else raise InvalidDIDUpdate
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
three Beacon Types: `SingletonBeacon`, `CIDAggregateBeacon`, and
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
1. Set `signalsMetadata` to the result of passing `sourceDocument`, `beaconIds` and
   `didUpdateInvocation` to the
   [Announce DID Update Payload] algorithm.
1. Return `signalsMetadata`. It is up to implementations to ensure that the
   `signalsMetadata` is persisted.

#### Construct DID Update Payload

This algorithm takes in a `btc1Identifier`, `sourceDocument`, `sourceVersionId`,
and `documentPatch` objects. It applies the `documentPatch` to the `sourceDocument`
and verifies the resulting `targetDocument` is a conformant DID document. Then
it constructs and returns an unsigned DID Update Payload.

1. Check that `sourceDocument.id` equals `btc1Identifier` else MUST raise
   `invalidDIDUpdate` error.
1. Initialize `didUpdatePayload` to an empty object.
1. Set `didUpdatePayload.@context` to the following list // TODO: Need to add btc1 context.
   `["https://w3id.org/zcap/v1", "https://w3id.org/security/data-integrity/v2", 
   "https://w3id.org/json-ld-patch/v1"]`
1. Set `didUpdatePayload.patch` to `documentPatch`.
1. Set `targetDocument` to the result of applying the `documentPatch` to the
   `sourceDocument`, following the JSON Patch specification.
1. Validate `targetDocument` is a conformant DID document, else MUST raise
   `invalidDIDUpdate` error.
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

The algorithm returns the invoked DID Update Payload.

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
1. // TODO: need to setup a the proof instantiation such that it can resolve
   / dereference the root capability. This is deterministic from the DID.
1. Set `didUpdateInvocation` to the result of executing the
   [Add Proof](https://www.w3.org/TR/vc-data-integrity/#add-proof)
   algorithm from VC Data Integrity passing `didUpdatePayload` as the input document,
   `cryptosuite`, and the set of `proofOptions`.
1. Return `didUpdateInvocation`.

#### Root did:btc1 Update Capabilities

Note: Not sure if these algorithms should go here or in the appendix?

##### Derive Root Capability from **did:btc1** Identifier

This algorithm deterministically generates a ZCAP-LD root capabilitiy from a
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

```json
{
  "@context": "https://w3id.org/zcap/v1",
  "id": "urn:zcap:root:did:btc1:k1q0rnnwf657vuu8trztlczvlmphjgc6q598h79cm6sp7c4fgqh0fkc0vzd9u",
  "controller": "did:btc1:k1q0rnnwf657vuu8trztlczvlmphjgc6q598h79cm6sp7c4fgqh0fkc0vzd9u",
  "invocationTarget": "did:btc1:k1q0rnnwf657vuu8trztlczvlmphjgc6q598h79cm6sp7c4fgqh0fkc0vzd9u"
}
```

##### Dereference Root Capability Identifier

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
1. Set `bct1Identifier` the result of `decodeURIComponent(uriEncodedId)`.
1. Set `rootCapability.id` to `capabilityId`.
1. Set `rootCapability.controller` to `btc1Identifier`.
1. Set `rootCapability.invocationTarget` to `btc1Identifier`.
1. Return `rootCapability`.

Below is an example of a `didUpdatePayload`. An invoked ZCAP-LD capability
containing a `patch` defining how the DID document for
**did:btc1:k1q0rnnwf657vuu8trztlczvlmphjgc6q598h79cm6sp7c4fgqh0fkc0vzd9u** SHOULD
be mutated.

```jsonld
{'@context': [
  'https://w3id.org/zcap/v1',
  'https://w3id.org/security/data-integrity/v2',
  'https://w3id.org/json-ld-patch/v1'
  ],
 'patch': [
  {'op': 'add',
   'path': '/service/4',
   'value': {
    'id': '#linked-domain',
    'type': 'LinkedDomains',
    'serviceEndpoint': 'https://contact-me.com'
    }}
  ],
 'proof': {
  'type': 'DataIntegrityProof',
  'cryptosuite': 'secp-schnorr-2024',
  'verificationMethod':'did:btc1:k1q0rnnwf657vuu8trztlczvlmphjgc6q598h79cm6sp7c4fgqh0fkc0vzd9u#initialKey',
  'invocationTarget':'did:btc1:k1q0rnnwf657vuu8trztlczvlmphjgc6q598h79cm6sp7c4fgqh0fkc0vzd9u',
  'capability': 'urn:zcap:root:did%3Abtc1%3Ak1q0rnnwf657vuu8trztlczvlmphjgc6q598h79cm6sp7c4fgqh0fkc0vzd9u',
  'capabilityAction': 'Write',
  'proofPurpose': 'assertionMethod',
  'proofValue':'z381yXYmxU8NudZ4HXY56DfMN6zfD8syvWcRXzT9xD9uYoQToo8QsXD7ahM3gXTzuay5WJbqTswt2BKaGWYn2hHhVFKJLXaDz'
  }
}
```

#### Announce DID Update Payload

This algorithm takes in a `sourceDocument`, an array of `beaconIds`, and a
`didUpdateInvocation`. It retrieves `beaconServices` from the `sourceDocument`
and calls the [Broadcast DID Update Attestation] algorithm corresponding the type of
the Beacon. The algorithm returns an array of `signalsMetadata`, containing the
necessary data to validate the Beacon Signal against the `didUpdateInvocation`.

1. Set `beaconServices` to an empty array.
1. Set `signalMetadata` to an empty array.
1. For `beaconId` in `beaconIds`:
    1. Find `beaconService` in `sourceDocument.service` with an `id` property
       equal to `beaconId`.
    1. If no `beaconService` MUST throw `beaconNotFound` error.
    1. Push `beaconService` to `beaconServices`.
1. For `beaconService` in `beaconServices`:
    1. If `beaconService.type` == `SingletonBeacon`:
        1. Set `signalMetadata` to the result of
           passing `beaconService` and `didUpdateInvocation` to the
           [Broadcast DID Update Attestation] algorithm.
        1. Push `signalMetadata` to `signalsMetadata`.
    1. Else If `beaconService.type` == `CIDAggregateBeacon`:
        1. Set `signalId` to the result of
           passing `beaconService` and `didUpdateInvocation` to the
           [Broadcast DID Update Attestation] algorithm.
        1. Push `signalMetadata` to `signalsMetadata`.
    1. Else If `beaconService.type` == `SMTAggregateBeacon`:
        1. Push `signalMetadata` to `signalsMetadata`
           passing `beaconService` and `didUpdateInvocation` to the
           [Broadcast DID Update Attestation] algorithm.
        1. Push `signalMetadata` to `signalsMetadata`.
    1. Else:
        1. MUST throw `invalidBeacon` error.
1. Return `signalsMetadata`.

// Note: need to update the Beacon Signal algorithms to reflect returning the `signalsMetadata`.
Idea is this data object contains all the info necessary to be stored by the DID
controller. So that they can prove a Beacon Signal announces an update. This might
just be, the Signal txid and the update itself. But in the SMT case we need additional
merkleProofs.

### Deactivate

To deactivate a **did:btc1**, the DID controller MUST add the property `deactivated`
with the value `true` on the DID document. To do this, the DID controller constructs
a valid DID Update payload with a JSON patch that adds this propery and announces
the payload through a Beacon in their current DID document following the algorithm
in [Update]. Once a **did:btc1** has been deactivated this
state is considered permanent and resolution MUST terminate.
