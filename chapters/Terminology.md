## Terminology

Beacon

: A Beacon is the mechanism by which updates to Decentralized Identifier (DID)
  documents are announced and discovered.

  Beacons are identified by a Bitcoin address which is included as a
  service endpoint in a DID document along with a specific ::Beacon Type::. By spending
  from a Beacon address, DID controllers announce that an update to their DID has
  occurred (in the case of a SingletonBeacon) or may have occurred (in the case
  of a CIDAggregate or SMTAggregate Beacons).

Beacons

: ::Beacon::

Beacon's

: ::Beacon::

Singleton Beacon

: A Singleton Beacon enables a single entity to independently post a ::DID Update
  Payload:: in a ::Beacon Signal::.

Aggregate Beacon

: An Aggregate Beacon enables multiple entities (possibly controlling multiple
  DIDs and possibly posting multiple updates) to collectively announce a set of
  ::DID Update Payloads:: in a ::Beacon Signal::.

  There can only ever be one ::DID Update Payload:: per **did:btc1** in a ::Beacon
  Signal:: from an Aggregate Beacon.

Beacon Type

: One of SingletonBeacon, CIDAggregateBeacon, or SMTAggregateBeacon.

Beacon Types

: ::Beacon Type::

Beacon Signal

: Beacon Signals are Bitcoin transactions that spend from a ::Beacon:: address and
  include a transaction output of the format `[OP_RETURN, <32_bytes>]`. Beacon
  Signals announce one or more ::DID Update Payloads:: and provide a means for these
  payloads to be verified as part of the Beacon Signal.

  The type of the ::Beacon::  determines how these Beacon Signals SHOULD be
  constructed and processed to validate a set of ::DID Update Payloads:: against the
  32 bytes contained within the Beacon Signal.

Beacon Signals

: ::Beacon Signal::

Authorized Beacon Signal

: An Authorized Beacon Signal is a ::Beacon Signal:: from a ::Beacon:: with a ::Beacon::
  address in a then-current DID document.

DID Update Payload

: A capability invocation secured using Data Integrity that invokes the root 
  capability to update a specific **did:btc1**. The signed payload includes a
  JavaScript Object Notation (JSON) Patch object defining a set of mutations to 
  the DID document being updated.

DID Update Payloads

: ::DID Update Payload::

DID's Update Payload

: ::DID Update Payload::

DID Update Bundle

: A JSON object that maps **did:btc1** identifiers to ::Content Identifiers:: (CIDs)
  that identify ::DID Update Payloads:: for the identified DID. DID Update Bundles
  are announced by CIDAggregate Beacons.

Merkle Tree

: A tree data structure in which the leaves are a hash of a data block and every
  node that is not a leaf is a hash of its child node values.

  The root of a Merkle tree is a single hash that is produced by recursively
  hashing the child nodes down to the leaves of the tree. Given the root of a
  Merkle tree it is possible to provide a Merkle path that proves the inclusion
  of some data in the tree.

Sparse Merkle Tree

: A Sparse Merkle Tree (SMT) is a ::Merkle Tree:: where each data point included
  at the leaf of the tree is indexed.

  This data structure enables proofs of both inclusion and non-inclusion of data
  at a given index. The instantiation in this specification has 2^256 leaves
  that are indexed by the SHA256 hash of a **did:btc1** identifier. The data
  attested to at the leaves of the tree is the ::DID Update Payload:: for that
  **did:btc1** identifier that indexed to the leaf.

SMT

: ::Sparse Merkle Tree::

Invocation

: See https://w3c-ccg.github.io/zcap-spec/#terminology

Schnorr Signature

: An alternative to Elliptic Curve Digital Signature Algorithm (ECDSA) signatures 
  with some major advantages, such as being able  to combine digital signatures 
  from multiple parties to form a single digital signature for the composite public key.

  Bitcoin Schnorr signatures are still over the secp256k1 curve, so the same
  keypairs can be used to produce both Schnorr signatures and ECDSA signatures.

Schnorr Signatures

: ::Schnorr Signature::

Schnorr

: ::Schnorr Signature::

Taproot

: Taproot is an upgrade to the Bitcoin blockchain implemented in November 2021.
  This upgrade enabled Bitcoin transactions to be secured using ::Schnorr Signatures::
  through the introduction of a new address, a Taproot address.

Unspent Transaction Output

: A Bitcoin transaction takes in transaction outputs as inputs and creates new
  transaction outputs potentially controlled by different addresses. An Unspent
  Transaction Output (UTXO) is a transaction output from a Bitcoin transaction
  that has not yet been included as an input, and hence spent, within another
  Bitcoin transaction.

UTXO

: ::Unspent Transaction Output::

Content Identifier

: A Content Identifier (CID) is an identifier for some digital content (e.g., a
  file) generated from the content itself such that for any given content and CID
  generation algorithm there is a single, unique, collision-resistant identifier.
  This is typically done through some hashing function.

Content Identifiers

: ::Content Identifier::

CID

: ::Content Identifier::

CIDs

: ::Content Identifier::

Content Addressable Storage

: Content Addressable Storage (CAS) is a data storage system where content is
  addressable using ::Content Identifiers:: (CIDs). The InterPlanetary File System
  (IPFS) is an example of CAS.

CAS

: ::Content Addressable Storage::

Non-Repudiation

: Non-Repudiation is a feature of DID methods that can clearly state that all data
  is available to present one canonical history for a DID.

  If some data is needed but not available, the DID method MUST NOT allow DID
  resolution to complete. Any changes to the history, such as may occur if a website
  edits a file, MUST be detected and disallowed. The ::Late Publishing:: problem
  breaks Non-Repudiation.

Late Publishing

: Late Publishing is the ability for DID updates to be revealed at a later point
  in time, which alters the history of a DID document such that a state, that
  appeared valid before the reveal, appears after Late Publishing to never have
  been valid. Late Publishing breaks ::Non-Repudiation::.

Offline Creation

: Offline creation refers to when a **did:btc1** identifier and corresponding
  initial DID document are created without requiring network interactions.

**did:btc1** supports offline creation in two modes:

* Key Pair Deterministic Creation; and
* DID Document Initiated Creation.

Sidecar

: A mechanism by which data necessary for resolving a DID is provided alongside
  the **did:btc1** identifier being resolved, rather than being retrieved through
  open and standardized means (e.g., by retrieving from IPFS).

: To explain the metaphor, a sidecar on a motorcycle brings along a second passenger
  in a transformed vehicle, the same way the DID controller MUST bring along the
  DID document history to transform the situation into one that is verifiable.

Sidecar Data

: Data transmitted via ::Sidecar::.

Signal Blockheight

: The blockheight of the Bitcoin block that included a specific ::Beacon Signal::.
  Blockheight is used as the internal time of the resolution algorithm.

Resolution Time

: A Coordinated Universal Time (UTC) timestamp of when the client makes a resolution 
  request of the controller.

Target Time

: A UTC timestamp that specifies a target time provided by a client in a resolution
  request to the resolver. If none is provided the target time is set to the
  ::Resolution Time::.

Contemporary Blockheight

: The blockheight of consideration when walking the provenance of a series of DID
  updates. A DID document's contemporary time is the Signal Time of the ::Beacon Signal::
  that announced the last ::DID Update Payload:: applied to the DID document.
