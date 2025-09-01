## CRUD Operations

This section defines the Create, Read, Update, and Deactivate (CRUD) operations
for the **did:btc1** method.

### Create

The Create operation consists of two main algorithms for creating identifiers
and DID documents. A **did:btc1** identifier and DID document can either be created
from a deterministic key pair or from an external ::intermediate DID document::.
In both cases, DID creation can be undertaken in an offline manner, i.e., the DID
controller does not need to interact with the Bitcoin network to create their DID.

#### From Deterministic Key Pair

The From Deterministic Key Pair algorithm encodes a secp256k1 public key
as a **did:btc1** identifier. The public key is then used to deterministically
generate the ::initial DID document::.

It takes the following inputs:

* `pubKeyBytes` - a compressed SEC encoded secp256k1 public key; REQUIRED; bytes
* `version` - the identifier version; OPTIONAL; integer; default=1.
* `network` - the Bitcoin network used for the identifier; OPTIONAL; string; default=`"bitcoin"`.

It returns the following outputs:

* `did` - a newly created **did:btc1** identifier; string
* `initialDocument` - the valid first version of a DID document for a given **did:btc1** identifier.

The steps are as follows:

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

#### From External Intermediate DID Document

The From External ::intermediate DID document:: algorithm enables the ability 
to create a **did:btc1** from an external ::intermediate DID document::. This allows for a
more complex ::initial DID document::, including the ability to include
Service Endpoints and ::BTC1 Beacons:: that support aggregation.

It takes the following inputs:

* `intermediateDocument` - any arbitrary, valid DID document with the `identifier`
   replaced with the placeholder value throughout all fields (e.g. the id field)
   `did:btc1:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`. It
   SHOULD include at least one `verificationMethod` and `service` of the type
   ::SingletonBeacon::; REQUIRED; object.
* `version` - the identifier version; OPTIONAL; integer; default=1.
* `network` - the Bitcoin network where the DID and DID document can be resolved;
   OPTIONAL; string; default=`"bitcoin"`.

It returns the following outputs:

* `did` - a newly created **did:btc1** identifier; string
* `initialDocument` - the valid first version of a DID document for a given btc1 identifier.

The steps are as follows:

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
   system like the InterPlanetary File System (IPFS). If doing so, implementations
   MUST use ::Content Identifiers:: (::CIDs::) generated following the IPFS v1 algorithm.
1. Return `did` and `initialDocument`.

### Read

The Read operation is an algorithm consisting of a series of subroutine algorithms
executed by a resolver after a resolution request identifying a specific
**did:btc1** `identifier` is received from a client at ::Resolution Time::.
The request MUST always contain the `resolutionOptions` object containing additional
information to be used in resolution. This object MAY be empty. 
See the [DID Resolution specification](https://w3c.github.io/did-resolution/#did-resolution-options) for further details about the DID Resolution Options object.
The resolver then attempts to resolve the
DID document of the `identifier` at a specific ::Target Time::. The
::Target Time:: is either provided in `resolutionOptions` or is set to the
::Resolution Time:: of the request.

It takes the following inputs:

* `identifier` - a valid **did:btc1** identifier; REQUIRED; string
* `resolutionOptions` - an object that extends the default options per
   the [DID Resolution specification](https://w3c.github.io/did-resolution/#did-resolution-options);
   the below list is not intended to be exhaustive; OPTIONAL; object
   * `versionId` - the version of the DID and DID document, an incrementing integer starting
      from 1; OPTIONAL; integer
   * `versionTime` - a timestamp used during resolution as a bound for when to
      stop resolving; OPTIONAL; integer
   * `sidecarData` - data necessary for resolving a DID such as ::BTC1 Updates:: and
      ::SMT proofs::; OPTIONAL; object.
   * `network` - the Bitcoin network used for resolution; OPTIONAL; string; default=`"bitcoin"`

It returns the following output:

* `targetDocument` - a DID Core conformant DID document after all updates have
   been found, validated and applied; object

The steps are as follows:

1. Pass `identifier` to the [did:btc1 Identifier Decoding](#didbtc1-identifier-decoding)
   algorithm, retrieving `idType`, `version`, `network`, and `genesisBytes`.
1. Set `identifierComponents` to a map of `idType`, `version`, `network`, and `genesisBytes`.
1. Set `initialDocument` to the result of running the algorithm in
   [Resolve Initial DID Document] passing in the `identifier`, `identifierComponents`
   and `resolutionOptions`.
1. Set `targetDocument` to the result of running the algorithm in
   [Resolve Target Document] passing in `initialDocument` and `resolutionOptions`.
1. Return `targetDocument`.

#### Resolve Initial DID Document

This algorithm specifies how to resolve an ::initial DID document:: and validate
it against the `identifier` for a specific **did:btc1**.

It takes the following inputs:

* `identifier` - a valid **did:btc1** identifier; REQUIRED; string
* `identifierComponents` - The decoded parts of a **did:btc1** identifier; REQUIRED; object
  * `idType` - the type of identifier (`KEY` or `EXTERNAL`); REQUIRED; string
  * `version` - the identifier version; REQUIRED; integer
  * `network` - the Bitcoin network used for the identifier; REQUIRED; string
  * `genesisBytes` - the originating public key; REQUIRED; bytes
* `resolutionOptions` - options that extends the default options per
   the [DID Resolution specification](https://w3c.github.io/did-resolution/#did-resolution-options); OPTIONAL; object
  * `versionId` - the version of the DID and DID document, an incrementing integer starting
    from 1; the below list is not intended to be exhaustive; OPTIONAL; integer
  * `versionTime` - a timestamp used during resolution as a bound for when to
      stop resolving; OPTIONAL; integer
  * `sidecarData` - data necessary for resolving a DID such as ::BTC1 Updates:: and
    ::SMT proofs::.; OPTIONAL; object
  * `network` - the Bitcoin network used for resolution; OPTIONAL; string; default=`"bitcoin"`

It returns the following output:

* `initialDocument` - the valid first version of a DID document for a given btc1 identifier.

The steps are as follows:

1. If `identifierComponents.idType` value is "key", then set the `initialDocument`
   to the result of running the algorithm in
   [Deterministically Generate Initial DID document] passing in the `identifier`
   and `identifierComponents` values.
1. Else If `identifierComponents.idType` value is "external", then set the
   `initialDocument` to the result of running [External Resolution] passing in
   the `identifier`, `identifierComponents` and `resolutionOptions` values.
1. Else MUST raise `invalidHRPValue` error.
1. Return `initialDocument`.

##### Deterministically Generate Initial DID Document

The Deterministically Generate ::initial DID document:: algorithm generates an
::initial DID document:: from a secp256k1 public key.

It takes the following inputs:

* `identifier` - a valid **did:btc1** identifier; REQUIRED; string
* `identifierComponents` - The decoded parts of a **did:btc1** identifier; REQUIRED; object
  * `idType` - the type of identifier (`KEY` or `EXTERNAL`); REQUIRED; string
  * `version` - the identifier version; REQUIRED; integer
  * `network` - the Bitcoin network used for the identifier; REQUIRED; string
  * `genesisBytes` - the originating public key; REQUIRED; bytes

It returns the following output:

* `initialDocument` - the valid first version of a DID document for a given *did:btc1*** identifier.

The steps are as follows:

1. Set `keyBytes` to `identifierComponents.genesisBytes`.
1. Initialize an `initialDocument` variable as an empty object.
1. Set `initialDocument.id` to the `identifier`.
1. Initialize a `contextArray` to empty array:
    1. Append the DID Core v1.1 context "https://www.w3.org/ns/did/v1.1".
    1. Append the **did:btc1** context "https://btc1.dev/context/v1".
    1. Set `initialDocument['@context]' to contextArray`.
1. Create an initial verification method:
    1. Initialize `verificationMethod` to an empty object.
    1. Set `verificationMethod.id` to `{identifier}#initialKey`.
    1. Set `verificationMethod.type` to "Multikey".
    1. Set `verificationMethod.controller` to `identifier`.
    1. Set `verificationMethod.publicKeyMultibase` to the result of the encoding
       algorithm in [BIP340 Multikey](https://dcdpr.github.io/data-integrity-schnorr-secp256k1/#multikey).
1. Set `initialDocument.verificationMethod` to an array containing
   `verificationMethod`.
1. Initialize a `tempArray` variable to an array with the single element
   `verificationMethod.id`.
1. Set the `authentication`, `assertionMethod`, `capabilityInvocation`, and the
   `capabilityDelegation` properties in `initialDocument` to a copy of the `tempArray`
   variable.
1. Set the `initialDocument.services` property in `initialDocument` to the
   result of passing the `identifier`, `keyBytes` and `identifierComponents.network` to the
   [Deterministically Generate Beacon Services] algorithm.
1. Return `initialDocument`.

###### Deterministically Generate Beacon Services

The Deterministically Generate Beacon Services algorithm generates three
::BTC1 Beacons:: from the single `keyBytes` value used to generate the deterministic
**did:btc1**, one for each of the following three Bitcoin address types for the
Bitcoin `network` specified by the DID:

* Pay-to-Public-Key-Hash (P2PKH)
* Pay-to-Witness-Public-Key-Hash (P2WPKH); and
* Pay-to-Taproot (P2TR).

Spends from these three addresses can be produced only through signatures from the
private key associated with the `keyBytes`. Each ::BTC1 Beacon:: is a ::Singleton Beacon::.

It takes the following inputs:

* `identifier` - a valid **did:btc1** identifier; REQUIRED; string
* `keyBytes` - a compressed SEC encoded secp256k1 public key; REQUIRED; bytes
* `network` - the Bitcoin network used for the identifier; REQUIRED; string; default=`"bitcoin"`

It returns the following output:

* `services` - an array of ::BTC1 Beacon:: service objects containing the following properties
   * `type` - described the kind of service being defined used to determine how to produce updates; 
      REQUIRED; string; default=`"SingletonBeacon"`
   * `id` - the **did:btc1** identifier controlling the beacon including the DID fragment pointing
      to the location of a key in the DID document; REQUIRED; string
   * `serviceEndpoint` - a P2PKH, P2WPKH or P2TR bitcoin address where beacon signals can be broadcast; REQUIRED; string

Below is an example of a returning object:

```{.json include="json/CRUD-Operations/Read-deterministically-generate-beacon-services.json"}
```

The steps are as follows:

1. Initialize a `services` variable to an empty array.
1. Set `serviceId` to `{identifier}#initialP2PKH`.
1. Set `beaconAddress` to the result of generating a Pay-to-Public-Key-Hash Bitcoin
   address from the `keyBytes` for the appropriate `network`.
1. Set `p2pkhBeacon` to the result of passing `serviceId`, and
   `beaconAddress` to [Establish Singleton Beacon].
1. Push `p2pkhBeacon` to `services`.
1. Set `serviceId` to `{identifier}#initialP2WPKH`.
1. Set `beaconAddress` to the result of generating a Pay-to-Witness-Public-Key-Hash
   Bitcoin address from the `keyBytes` for the appropriate `network`.
1. Set `p2wpkhBeacon` to the result of passing `serviceId`, and
   `beaconAddress` to [Establish Singleton Beacon].
1. Push `p2wpkhBeacon` to `services`.
1. Set `serviceId` to `{identifier}#initialP2TR`.
1. Set `beaconAddress` to the result of generating a Pay-to-Taproot Bitcoin address
   from the `keyBytes` for the appropriate `network`.
1. Set `p2trBeacon` to the result of passing `serviceId`, and
   `beaconAddress` to [Establish Singleton Beacon].
1. Push `p2trBeacon` to `services`.
1. Return the `services` array.

##### External Resolution

The External Resolution algorithm externally retrieves an ::intermediate DID document::
as an `intermediateDocumentRepresentation`, either by retrieving it from
::Content Addressable Storage:: (CAS) or from the ::Sidecar Data:: provided as
part of the resolution request.

It takes the following inputs:

* `identifier` - a valid **did:btc1** identifier; REQUIRED; string
* `identifierComponents` - The decoded parts of a **did:btc1** identifier; REQUIRED; object
  * `idType` - the type of identifier (`KEY` or `EXTERNAL`); REQUIRED; string
  * `version` - the identifier version; REQUIRED; integer
  * `network` - the Bitcoin network used for the identifier; REQUIRED; string
  * `genesisBytes` - the originating ::intermediate DID document::; REQUIRED; bytes
* `resolutionOptions` - options that extends the default options per
   the [DID Resolution specification](https://w3c.github.io/did-resolution/#did-resolution-options);
   the below list is not intended to be exhaustive; OPTIONAL; object
  * `versionId` - the version of the DID and DID document, an incrementing integer starting
    from 1; OPTIONAL; integer
  * `versionTime` - a timestamp used during resolution as a bound for when to
      stop resolving; OPTIONAL; integer
  * `sidecarData` - data necessary for resolving a DID such as ::BTC1 Updates:: and
    ::SMT proofs::.; OPTIONAL; object
  * `network` - the Bitcoin network used for resolution; OPTIONAL; string; default=`"bitcoin"`

It returns the following output:

* `initialDocument` - a valid ::initial DID document::: for the given identifier; object

The steps are as follows:

1. If `resolutionOptions.sidecarData.initialDocument` is not null, set
   `initialDocument` to the result of passing `identifier`, `identifierComponents`,
   and `resolutionOptions.sidecarData.initialDocument` into algorithm
   [Sidecar Initial DID Document Validation].
1. Else set `initialDocument` to the result of passing `identifier` and
   `identifierComponents` to the [CAS Retrieval] algorithm.
1. Validate `initialDocument` is a conformant DID document according to the
   DID Core 1.1 specification. Else MUST raise `invalidDidDocument` error.
1. Return `initialDocument`.

###### Sidecar Initial DID Document Validation

The Sidecar ::Initial DID Document:: Validation algorithm validates an
`initialDocument` against its `identifier`, by first constructing the
::intermediate DID document:: representation and verifying that the hash of the
`intermediateDocumentRepresentation` matches the bytes encoded within the `identifier`.

It takes the following inputs:

* `identifier` - a valid **did:btc1** identifier; REQUIRED; string
* `identifierComponents` - The decoded parts of a **did:btc1** identifier; REQUIRED; object
  * `idType` - the type of identifier (`KEY` or `EXTERNAL`); REQUIRED; string
  * `version` - the identifier version; REQUIRED; integer
  * `network` - the Bitcoin network used for the identifier; REQUIRED; string
  * `genesisBytes` - the originating ::intermediate DID document::; REQUIRED; bytes
* `initialDocument` - the ::initial DID document:: for the given identifier.

It returns the following outputs or throws an error:

* `initialDocument` - a valid ::initial DID document:: for the given identifier.

The steps are as follows:

1. Set `intermediateDocumentRepresentation` to a copy of the `initialDocument`.
1. Find and replace all values of `identifier` contained within the
   `intermediateDocumentRepresentation` with the string
   (`did:btc1:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`).
1. Set `hashBytes` to the SHA256 hash of the `intermediateDocumentRepresentation`.
1. If `hashBytes` does not equal `identifierComponents.genesisBytes` MUST throw an `invalidDid` error.
1. Return `initialDocument`.

###### CAS Retrieval

The CAS Retrieval algorithm attempts to retrieve an ::initial DID document::
from a ::Content Addressable Storage:: (CAS) system by converting the bytes in
the `identifier` into a ::Content Identifier:: (CID).

It takes the following inputs:

* `identifier` - a valid **did:btc1** identifier; REQUIRED; string
* `identifierComponents` - The decoded parts of a **did:btc1** identifier; REQUIRED; object
  * `idType` - the type of identifier (`KEY` or `EXTERNAL`); REQUIRED; string
  * `version` - the identifier version; REQUIRED; integer
  * `network` - the Bitcoin network used for the identifier; REQUIRED; string
  * `genesisBytes` - the originating ::intermediate DID document::; REQUIRED; bytes

It returns the following output:

* `initialDocument` - a valid ::initial DID document:: for the given identifier.

The steps are as follows:

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

The Resolve Target Document algorithm resolves a DID document from an initial
document by walking the Bitcoin blockchain to identify ::Beacon Signals:: that
announce ::BTC1 Updates:: applicable to the **did:btc1** identifier being
resolved. 

It takes the following inputs:

* `initialDocument` - the ::initial DID document:: that was used to initiate the **did:btc1**
   identifier being resolved as verified by the [Resolve Initial DID Document] algorithm.
   A DID Core conformant DID document; REQUIRED; object
* `resolutionOptions` - options that extends the default options per
   the [DID Resolution specification](https://w3c.github.io/did-resolution/#did-resolution-options);
   the below list is not intended to be exhaustive; OPTIONAL; object
  * `versionId` - the version of the DID and DID document, an incrementing integer starting
    from 1; OPTIONAL; integer
  * `versionTime` - a timestamp used during resolution as a bound for when to
      stop resolving; OPTIONAL; integer
  * `sidecarData` - data necessary for resolving a DID such as ::BTC1 Updates:: and
    ::SMT proofs::.; OPTIONAL; object
  * `network` - the Bitcoin network used for resolution; OPTIONAL; string; default=`"bitcoin"`

It returns the following output or throws an error:

* `targetDocument` - a DID Core conformant DID document after all updates have
   been found, validated and applied; object

The steps are as follows:

1. If `resolutionOptions.versionId` is not null, set `targetVersionId` to
   `resolutionOptions.versionId`.
1. Else if `resolutionOptions.versionTime` is not null, set `targetTime` to
   `resolutionOptions.versionTime`.
1. Else set `targetTime` to the UNIX timestamp for now at the moment of execution.
1. Set `signalsMetadata` to `resolutionOptions.sidecarData.signalsMetadata`.
1. Set `currentVersionId` to 1.
1. If `currentVersionId` equals `targetVersionId` return `initialDocument`.
1. Set `btc1UpdateHashHistory` to an empty array.
1. Set `didDocumentHistory` to an array containing the `initialDocument`.
1. Set `contemporaryBlockheight` to 0.
1. Set `contemporaryDIDDocument` to the `initialDocument`.
1. Set `targetDocument` to the result of calling the [Traverse Bitcoin Blockchain History]
   algorithm passing in `contemporaryDIDDocument`, `contemporaryBlockheight`,
   `currentVersionId`, `targetVersionId`, `targetTime`, `didDocumentHistory`,
   `btc1UpdateHashHistory`, `signalsMetadata`, and `network`.
1. Return `targetDocument`.

##### Traverse Bitcoin Blockchain History

The Traverse Bitcoin Blockchain History algorithm traverses this history of the
Bitcoin blockchain, starting from the block with the blockheight equal to
`contemporaryBlockheight`, to find `beaconSignals` emitted by ::BTC1 Beacons::
specified within the `contemporaryDIDDocument`. Each `beaconSignal` is processed
to retrieve a ::BTC1 Update:: defining updates to the DID document. Each
update is applied to the document and duplicates are ignored. The algorithm
recursively executes until either a `targetVersionId` for the DID document is
reached, or the blockchain history passes the supplied `targetTime`. At this
point the current `contemporaryDIDDocument` is returned.

It takes the following inputs:

* `contemporaryDIDDocument` - the DID document for the **did:btc1** identifier 
   being resolved that is current at the blockheight of the `contemporaryBlockheight`. 
   A DID Core conformant DID document; REQUIRED; object.
* `contemporaryBlockheight` - a Bitcoin blockheight identifying the contemporary time 
   at which the resolution algorithm has reached as it traverses each block in the 
   blockchain history. an integer greater of equal to 0; REQUIRED; integer.
* `currentVersionId` - the version of the ::contemporary DID document::. An integer starting from 
   1 and incrementing by 1 with each ::BTC1 Update:: applied to the DID document; REQUIRED; integer.
* `targetVersionId` - the version of the DID document that the resolution algorithm is attempting to resolve;
   OPTIONAL; integer.
* `targetTime` - a 64-bit UNIX timestamp that can be used to target specific historical states of a DID document.
   Only ::Beacon Signals:: included in the Bitcoin blockchain before the `targetTime` are processed by the
   resolution algorithm; REQUIRED; integer.
* `didDocumentHistory` - an ordered array of DID documents from version 1 up to the
   current version; REQUIRED; array.
* `btc1UpdateHashHistory` - an ordered array of SHA256 hashes of ::BTC1 Updates:: 
   that have been applied to the DID document by the resolution algorithm in order 
   to construct the `contemporaryDIDDocument`; REQUIRED; array.
* `signalsMetadata` - a Map from Bitcoin transaction identifiers of ::Beacon Signals::
   to an object containing ::Sidecar Data:: for that signal provided as part of the
   `resolutionOptions`; REQUIRED; Map containing the following properties:
   * `btc1Update` - a ::BTC1 Update:: which SHOULD match the update announced
      by the ::Beacon Signal::. In the case of a ::SMT:: proof of non-inclusion, no
      BTC1 Update MAY be provided; OPTIONAL; object
   * `proofs` - a ::Sparse Merkle Tree:: proof that the provided `btc1Update` value is
      the value at the leaf indexed by the **did:btc1** being resolved. REQUIRED; TODO: What exactly this
      structure is needs to be defined.
* `network` -  a string identifying the Bitcoin network of the **did:btc1** identifier.
   The algorithm MUST query the Bitcoin blockchain identified by the `network`; REQUIRED; string

It returns the following output once either `targetTime` or `targetVersionId` have been reached:

* `contemporaryDIDDocument` - A ::contemporary DID document:: conformant to DID Core resolved using updates found
   on-chain from genesis to `contemporaryBlockheight`.

The steps are as follows:

1. Set `contemporaryHash` to the result of passing `contemporaryDIDDocument` into the 
   [JSON Canonicalization and Hash] algorithm.
1. Find all ::BTC1 Beacons:: in `contemporaryDIDDocument.service` where `service.type` equals one of
   `SingletonBeacon`, `CIDAggregateBeacon` and `SMTAggregateBeacon`.
1. For each `beacon` in `beacons` convert the `beacon.serviceEndpoint` to a Bitcoin
   address following **[BIP21](https://github.com/bitcoin/bips/blob/master/bip-0021.mediawiki)**.
   Set `beacon.address` to the Bitcoin address.
1. Set `nextSignals` to the result of calling algorithm [Find Next Signals] passing 
   in `contemporaryBlockheight`, `beacons` and `network`.
1. If `nextSignals` is empty, return `contemporaryDIDDocument`.
1. If `nextSignals[0].blocktime` is greater than `targetTime`, return `contemporaryDIDDocument`.
1. Set `contemporaryBlockheight` to `nextSignals[0].blockheight`.
1. Set `updates` to the result of calling algorithm
   [Process Beacon Signals] passing in `nextSignals` and `signalsMetadata`.
1. Set `orderedUpdates` to the list of `updates` ordered by the `targetVersionId`
   property.
1. For `update` in `orderedUpdates`:
    1. If `update.targetVersionId` is less than or equal to `currentVersionId`,
       push `contemporaryHash` into the `btc1UpdateHashHistory` list and run the
       [Confirm Duplicate Update] algorithm passing in `btc1Update` and `btc1UpdateHashHistory`.
    1. If `update.targetVersionId` equals `currentVersionId + 1`:
        1.  Check that the base58 decoding of `update.sourceHash` equals `contemporaryHash`, else MUST
            raise `latePublishing` error.
        1.  Set `contemporaryDIDDocument` to the result of calling [Apply DID Update]
            algorithm passing in `contemporaryDIDDocument`, `update`.
        1.  Push `contemporaryDIDDocument` onto `didDocumentHistory`.
        1.  Increment `currentVersionId`.
        1.  Set `unsecuredUpdate` to a copy of the `update` object.
        1.  Remove the `proof` property from the `unsecuredUpdate` object.
        1.  Set `updateHash` to the result of passing `unsecuredUpdate` into the
            [JSON Canonicalization and Hash] algorithm.
        1.  Push `updateHash` onto `btc1UpdateHashHistory`.
        1.  Set `contemporaryHash` to result of passing `contemporaryDIDDocument` into the 
            [JSON Canonicalization and Hash] algorithm.
    1.  If `update.targetVersionId` is greater than `currentVersionId + 1`, MUST
        throw a LatePublishing error.
1. Increment `contemporaryBlockheight`.
1. Set `targetDocument` to the result of calling the
   [Traverse Bitcoin Blockchain History] algorithm passing in `contemporaryDIDDocument`,
   `contemporaryBlockheight`, `currentVersionId`, `targetVersionId`,
   `targetTime`, `didDocumentHistory`, `btc1UpdateHashHistory`, `signalsMetadata`, and `network`.
1. If `targetVersionId` in not null, set `targetDocument` to the index at the `targetVersionId`
   of the `didDocumentHistory` array.
1. Return `targetDocument`.

##### Find Next Signals

The Find Next Signals algorithm finds the next Bitcoin block containing ::Beacon Signals::
from one or more of the `beacons` and returns all ::Beacon Signals:: within that block.

Note: It is recommended that you use a Bitcoin indexer and API to query the Bitcoin blockchain:

* [electrs](https://github.com/romanz/electrs)
* [Esplora](https://github.com/Blockstream/esplora)

It takes the following inputs:

* `contemporaryBlockheight` - The height of the block this function is looking for 
   ::Beacon Signals:: in; REQUIRED; integer greater or equal to 0.
* `beacons` - An array of ::BTC1 Beacon:: services in the ::Contemporary DID document::; REQUIRED; array;
   Each Beacon is a structure with the following properties:
    * `id` - The id of the Beacon service in the DID document; REQUIRED; string.
    * `type` - The type of the Beacon service in the DID document; REQUIRED; string; MUST
      be either `SingletonBeacon`, `CIDAggregateBeacon`, or `SMTAggregateBeacon`.
    * `serviceEndpoint` - A BIP21 URI representing a Bitcoin address; REQUIRED; string.
    * `address` - The Bitcoin address decoded from the `serviceEndpoint value; REQUIRED; string.
* `network` - A string identifying the Bitcoin network of the **did:btc1** identifier.
   The algorithm MUST query the Bitcoin blockchain identified by the `network`; REQUIRED; string.
  
It returns the following output:

* `nextSignals` - an array of `signal` objects with the following properties:
    * `beaconId` - The id for the ::BTC1 Beacon:: that the ::Beacon Signal:: was announced by.
    * `beaconType` - The type of the ::BTC1 Beacon:: that announced the ::Beacon Signal::.
    * `tx` - The Bitcoin transaction that is the ::Beacon Signal::.
    * `blockheight` - The blockheight for the block that the Bitcoin transaction was included within.
    * `blocktime` - The timestamp that the Bitcoin block was included into the blockchain.

The steps are as follows:

1. Set `signals` to an empty array.
1. For each `beacon` in `beacons`:
   1. Set `beaconSpends` to the set of all Bitcoin transactions on the specified 
   `network` that spend at least one transaction input controlled by the `beacon.address`
   with a blockheight greater than or equal to the `contemporaryBlockheight`.
   1. Filter the `beaconSpends`, identifying all transactions whose last transaction output 
   is of the format `[OP_RETURN, OP_PUSHBYTES32, <32bytes>]`.
   1. For each of the filtered `beaconSpends`, push the following `beaconSignal` object onto the
      `signals` array.
   ```{.json include="json/CRUD-Operations/Read-find-next-signals-tx.json"}
   ```
1. If `signals` is empty, return `signals`.
1. Sort `signals` by `blockheight` from lowest to highest.
1. Set `nextSignals` to all `signals` with the lowest `blockheight`.
1. Return `nextSignals`.


##### Process Beacon Signals

The Process Beacon Signals algorithm processes each ::Beacon Signal:: by attempting to retrieve a ::BTC1 Update Announcement::
for a specific **did:btc1** identifier. Then the algorithm retrieves and validates the ::BTC1 Update:: committed to by the announcement. 
The ::Beacon Type:: of the ::BTC1 Beacon:: that broadcast the ::Beacon Signal:: defines the algorithms to retrieve and validate 
::BTC1 Update Announcements:: and their associated ::BTC1 Updates:: against the ::Beacon Signal::.

It takes the following inputs:

* `beaconSignals` - an array of struct representing ::Beacon Signals:: retrieved through executing
   the [Find Next Signals] algorithm; REQUIRED; object containing the follow properties:
   * `beaconId` - the id for the ::BTC1 Beacon:: that the `signal` was announced by; REQUIRED; string.
   * `beaconType` - the type of the ::BTC1 Beacon:: that announced the `signal`; REQUIRED; string.
   * `tx` - the Bitcoin transaction that is the ::Beacon Signal::; REQUIRED; string.
* `signalsMetadata` - a Map from Bitcoin transaction identifiers of ::Beacon Signals::
   to a struct containing ::Sidecar Data:: for that signal provided as part of the
   `resolutionOptions`; REQUIRED; object containing the following properties:
   * `btc1Update` - a ::BTC1 Update:: which SHOULD match the update announced
      by the ::Beacon Signal::. In the case of a ::SMT:: proof of non-inclusion, no
      ::BTC1 Update:: MAY be provided; OPTIONAL; object.
   * `proofs` - a ::Sparse Merkle Tree:: proof that the provided `btc1Update` value is
      the value at the leaf indexed by the **did:btc1** being resolved; OPTIONAL; object.

It returns the following output:

* `btc1Updates` - an array of ::BTC1 Updates::

The steps are as follows:

1. Set `updates` to an empty array.
1. For `beaconSignal` in `beaconSignals`:
    1. Set `type` to `beaconSignal.beaconType`.
    1. Set `signalTx` to `beaconSignal.tx`.
    1. Set `signalId` to `signalTx.id`.
    1. Set `signalSidecarData` to `signalsMetadata[signalId]`. TODO: formalize structure of sidecarData
   1. Set `btc1Update` to null.
   1. If `type` == `SingletonBeacon`:
      1. Set `btc1Update` to the result of passing `signalTx` and
        `signalSidecarData` to the [Process Singleton Beacon Signal] algorithm.
   1. If `type` == `CIDAggregateBeacon`:
      1. Set `btc1Update` to the result of passing `signalTx` and
        `signalSidecarData` to the [Process CIDAggregate Beacon Signal] algorithm.
   1. If `type` == `SMTAggregateBeacon`:
      1. Set `btc1Update` to the result of passing `signalTx` and
        `signalSidecarData` to the [Process SMTAggregate Beacon Signal] algorithm.
    1. If `btc1Update` is not null, push `btc1Update` to `updates`.
1. Return `updates`.

##### Confirm Duplicate Update

The Confirm Duplicate Update algorithm verifies that a ::BTC1 Update:: is a
duplicate against the hash history of previously applied updates.

It takes the following inputs:

* `btc1Update` - the ::unsecured BTC1 Update:: to confirm as a duplicate or not; REQUIRED; object.
* `btc1UpdateHashHistory` - an array of hashes corresponding to each ::BTC1 Update::; REQUIRED; array.

It returns successfully if the `update` is a duplicate else it throws an error.

The steps are as follows:

1. Let `unsecuredUpdate` be a copy of the `update` object.
1. Remove the `proof` property from the `unsecuredUpdate` object. 
1. Let `updateHash` equal the result of passing `unsecuredUpdate` into the [JSON Canonicalization and Hash] algorithm.
1. Let `updateHashIndex` equal `update.targetVersionId - 2`.
1. Let `historicalUpdateHash` equal `updateHashHistory[updateHashIndex]`.
1. Assert `historicalUpdateHash` equals `updateHash`, if not MUST throw a
   LatePublishing error.
1. Return

##### Apply DID Update

The Apply DID Update algorithm attempts to apply a DID Update to a DID document, it first
verifies the proof on the update is a valid capabilityInvocation of the root
authority over the DID being resolved. Then it applies the JSON patch
transformation to the DID document, checks the transformed DID document
matches the targetHash specified by the update and validates it is a conformant
DID document before returning it.

It takes the following inputs:

* `contemporaryDIDDocument` - the DID document for the **did:btc1** identifier 
   being resolved that is current at the blockheight of the `contemporaryBlockheight`. 
   A DID Core conformant DID document; REQUIRED; object.
* `update` - the ::BTC1 Update:: to apply to the `contemporaryDIDDocument`; REQUIRED; object.

It returns the following output:

* `targetDIDDocument` - The ::contemporary DID document:: with all updates applied to it; object.

The steps are as follows:

1. Set `capabilityId` to `update.proof.capability`.
1. Set `rootCapability` to the result of passing `capabilityId` to the [Dereference Root Capability Identifier] algorithm.
1. If `rootCapability.invocationTarget` does not equal `contemporaryDIDDocument.id` and `rootCapability.controller` 
   does not equal  `contemporaryDIDDocument.id`, MUST throw an `invalidDidUpdate` error.
1. Instantiate a [`bip340-jcs-2025` `cryptosuite`](https://dcdpr.github.io/data-integrity-schnorr-secp256k1/#instantiate-cryptosuite)
   instance using the key referenced by the `verificationMethod` field in the update.
   ```{.json include="json/CRUD-Operations/Update-apply-did-update.json"}
   ```
1. Set `expectedProofPurpose` to "capabilityInvocation".
1. Set `mediaType` to "application/ld+json".
1. Set `documentBytes` to the bytes representation of `update`.
1. Set `verificationResult` to the result of passing `mediaType`, `documentBytes`,
   `cryptosuite`, and `expectedProofPurpose` into the
   [Verify Proof algorithm](https://w3c.github.io/vc-data-integrity/#verify-proof)
   defined in the Verifiable Credentials (VC) Data Integrity specification.
1. If `verificationResult.verified` equals False, MUST raise an `invalidUpdateProof` exception.
1. Set `targetDIDDocument` to a copy of `contemporaryDIDDocument`.
1. Use JSON Patch to apply the `update.patch` to the `targetDIDDOcument`.
1. Verify that `targetDIDDocument` is conformant with the data model specified
   by the DID Core specification.
1. Set `targetHash` to the result of passing `targetDIDDocument` to the [JSON Canonicalization and Hash] algorithm.
1. Check that `targetHash` equals the base58 decoded `update.targetHash`, else raise InvalidDidUpdate
   error.
1. Return `targetDIDDocument`.

### Update

The Update algorithm calls a series of subroutines to construst, invoke and
announce ::BTC1 Updates:: for **did:btc1** identifiers and their
corresponding DID documents. An update to a **did:btc1** document is an invoked
capability using the [ZCAP-LD](https://w3c-ccg.github.io/zcap-spec/) data format,
signed by a `verificationMethod` that has the authority to make the update as specified
in the previous DID document. Capability invocations for updates MUST be authorized using Data Integrity
following the [BIP340 Data Integrity Cryptosuite](https://dcdpr.github.io/data-integrity-schnorr-secp256k1/#instantiate-cryptosuite)
with a `proofPurpose` of `capabilityInvocation`.

It takes the following inputs:

* `identifier` - a valid **did:btc1** identifier; REQUIRED; string.
* `sourceDocument` - the DID document being updated; REQUIRED; object.
* `sourceVersionId` - the version of the DID and DID document, an incrementing integer
   starting from 1; REQUIRED; integer.
* `documentPatch` - JSON Patch object containing a set of transformations to
   be applied to the `sourceDocument`. The result of these transformations MUST
   produce a DID document conformant to the DID Core specification; REQUIRED; object.
* `verificationMethodId` - identifier for a `verificationMethod` within the
   `sourceDocument`. The `verificationMethod` identified MUST be a
   [BIP340 Multikey](https://dcdpr.github.io/data-integrity-schnorr-secp256k1/#multikey);
   REQUIRED; string.
* `beaconIds` - an array containing the IDs that correspond to ::BTC1 Beacons:: in the DID
   document. These MUST identify service endpoints with one of the three ::Beacon Types::
   `SingletonBeacon`, `MapBeacon`, and `SMTBeacon`; REQUIRED; array.

It returns the following output:

* `signalsMetadata` - A Map from Bitcoin transaction identifiers of ::Beacon Signals:: 
   to a struct containing ::Sidecar Data:: for that signal provided as part of the
   `resolutionOptions`; Object containing the following properties:
   * `btc1Update` - A ::BTC1 Update:: which SHOULD match the update announced
      by the ::Beacon Signal::. In the case of a ::SMT:: proof of non-inclusion, the
      `btc1Update` will be null; object.
   * `proofs` - A ::Sparse Merkle Tree:: proof that the provided `btc1Update` value is
      the value at the leaf indexed by the **did:btc1** being resolved; array.

The steps are as follows:

1. Set `unsecuredUpdate` to the result of passing `btc1Identifier`, `sourceDocument`,
   `sourceVersionId`, and `documentPatch` into the [Construct BTC1 Update]
   algorithm.
1. Set `verificationMethod` to the result of retrieving the verificationMethod from
   `sourceDocument` using the `verificationMethodId`.
1. Validate the `verificationMethod` is a BIP340 Multikey:
    1. `verificationMethod.type` == `Multikey`
    1. `verificationMethod.publicKeyMultibase[4]` == `zQ3s`
1. Set `unsecuredBtc1Update` to the result of passing `btc1Identifier`,
   `unsecuredUpdate`, `and `verificationMethod` to the
   [Invoke BTC1 Update] algorithm.
1. Set `signalsMetadata` to the result of passing `btc1Identifier`, `sourceDocument`, 
   `beaconIds` and `unsecuredBtc1Update` to the [Announce DID Update] algorithm.
1. Return `signalsMetadata`. It is up to implementations to ensure that the
   `signalsMetadata` is persisted.

#### Construct BTC1 Update

The Construct BTC1 Update algorithm applies a `documentPatch` to a
`sourceDocument` and verifies the resulting `targetDocument` is a conformant
DID document.

It takes the following inputs:

* `identifier` - a valid **did:btc1** identifier; REQUIRED; string
* `sourceDocument` - the DID document being transformed by the `documentPatch`; REQUIRED; object.
* `sourceVersionId` - the version of the DID and DID document, an incrementing integer
   starting from 1; REQUIRED; integer.
* `documentPatch` - JSON Patch object containing a set of transformations to
   be applied to the `sourceDocument`. The result of these transformations MUST
   produce a DID document conformant to the DID Core specification; REQUIRED; object.

It returns the following output:

* `unsecuredBtc1Update` - a newly created ::BTC1 Update::; object

The steps are as follows:

1. Check that `sourceDocument.id` equals `btc1Identifier` else MUST raise
   `invalidDidUpdate` error.
1. Initialize `unsecuredBtc1Update` to an empty object.
1. Set `unsecuredBtc1Update.@context` to the following list.
   `["https://w3id.org/zcap/v1", "https://w3id.org/security/data-integrity/v2", 
   "https://w3id.org/json-ld-patch/v1", "https://btc1.dev/context/v1"]`
1. Set `unsecuredBtc1Update.patch` to `documentPatch`.
1. Set `targetDocument` to the result of applying the `documentPatch` to the
   `sourceDocument`, following the JSON Patch specification.
1. Validate `targetDocument` is a conformant DID document, else MUST raise
   `invalidDidUpdate` error.
1. Set `sourceHashBytes` to the result of passing `sourceDocument` into
   the [JSON Canonicalization and Hash] algorithm.
1. Set `unsecuredBtc1Update.sourceHash` to the base64 of `sourceHashBytes`.
1. Set `targetHashBytes` to the result of passing `targetDocument` into
   the [JSON Canonicalization and Hash] algorithm.
1. Set `unsecuredBtc1Update.targetHash` to the base64 of `targetHashBytes`.
1. Set `unsecuredBtc1Update.targetVersionId` to `sourceVersionId + 1`
1. Return `unsecuredBtc1Update`.

#### Invoke BTC1 Update

The Invoke BTC1 Update algorithm etrieves the `privateKeyBytes` for the
`verificationMethod` and adds a capability invocation in the form of a Data
Integrity proof following the [ZCAP-LD](https://w3c-ccg.github.io/zcap-spec/)
and Verifiable Credentials (VC) Data Integrity specifications.

It takes the following inputs:

* `identifier` - a valid **did:btc1** identifier; REQUIRED; string.
* `unsecuredBtc1Update` - an unsecured ::BTC1 Update::; REQUIRED; object.
* `verificationMethod` - an object containing reference to keys and/or Beacons to
   use for [ZCAP-LD](https://w3c-ccg.github.io/zcap-spec/); REQUIRED; string.

It returns the following output:

* `btc1Update` - a ::BTC1 Update:: object invoking the capability
   to update a specific **did:btc1** DID document.

The steps are as follows:

1. Set `privateKeyBytes` to the result of retrieving the private key bytes
   associated with the `verificationMethod` value. How this is achieved is left to
   the implementation.
1. Set `rootCapability` to the result of passing `btc1Identifier` into the
   [Derive Root Capability from **did:btc1** Identifier] algorithm.
1. Initialize `proofOptions` to an empty object.
1. Set `proofOptions.type` to `DataIntegrityProof`.
1. Set `proofOptions.cryptosuite` to `bip340-jcs-2025`.
1. Set `proofOptions.verificationMethod` to `verificationMethod.id`.
1. Set `proofOptions.proofPurpose` to `capabilityInvocation`.
1. Set `proofOptions.capability` to `rootCapability.id`.
1. Set `proofOptions.capabilityAction` to `Write`.
1. Set `cryptosuite` to the result of executing the Cryptosuite Instantiation
   algorithm from the [BIP340 Data Integrity specification](https://dcdpr.github.io/data-integrity-schnorr-secp256k1) passing in
   `proofOptions`.
1. Set `btc1Update` to the result of executing the
   [Add Proof](https://www.w3.org/TR/vc-data-integrity/#add-proof)
   algorithm from VC Data Integrity passing `unsecuredBtc1Update` as the input document,
   `cryptosuite`, and the set of `proofOptions`.
1. Return `btc1Update`.

#### Announce DID Update

The Announce DID Update algorithm retrieves `beaconServices` from the `sourceDocument`
and calls the Broadcast DID Update algorithm corresponding to the type of
the ::BTC1 Beacon::.

It takes the following inputs:

* `identifier` - a valid **did:btc1** identifier; REQUIRED; string.
* `sourceDocument` - the DID document being updated; REQUIRED; object.
* `beaconIds` - an array containing the IDs that correspond to ::BTC1 Beacons:: in the DID
   document. These MUST identify service endpoints with one of the three ::Beacon Types::
   `SingletonBeacon`, `MapBeacon`, and `SMTBeacon`; REQUIRED; array.
* `btc1Update` - a ::BTC1 Update:: object invoking the capability
   to update a specific **did:btc1** DID document; REQUIRED; object.

It returns the following output:

* `signalsMetadata` - a mapping from Bitcoin transaction identifiers of ::Beacon Signals:: 
   to a struct containing ::Sidecar Data:: for that signal, provided as part of the
   `resolutionOptions`; a map with the following properties:
   * `btc1Update` - a ::BTC1 Update:: which SHOULD match the update announced
      by the ::Beacon Signal::. In the case of a ::SMT:: proof of non-inclusion, the
      `btc1Update` will be null; object.
   * `proofs` - A ::Sparse Merkle Tree:: proof that the provided `btc1Update` value is
      the value at the leaf indexed by the **did:btc1** being resolved; object.

The steps are as follows:

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
        passing `beaconService` and `btc1Update` to the
        [Broadcast Singleton Beacon Signal] algorithm.
   1. Else If `beaconService.type` == `CIDAggregateBeacon`:
      1. Set `signalMetadata` to the result of
        passing `btc1Identifier`, `beaconService` and `btc1Update` to the
        [Broadcast CIDAggregate Beacon Signal] algorithm.
   1. Else If `beaconService.type` == `SMTAggregateBeacon`:
      1. Set `signalMetadata` to the result of
        passing `btc1Identifier`, `beaconService` and `btc1Update` to the
        [Broadcast SMTAggregate Beacon Signal] algorithm.
   1. Else:
      1. MUST throw `invalidBeacon` error.
  1. Merge `signalMetadata` into `signalsMetadata`.
1. Return `signalsMetadata`

### Deactivate

To deactivate a **did:btc1**, the DID controller MUST add the property `deactivated`
with the value `true` on the DID document. To do this, the DID controller constructs
a valid ::BTC1 Update:: with a JSON patch that adds this property and announces
the ::BTC1 Update:: by broadcasting an ::Authorized Beacon Signal:: following
the algorithm in [Update]. Once a **did:btc1** has been deactivated this
state is considered permanent and resolution MUST terminate.
