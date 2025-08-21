## Terminology

BTC1 Beacon

: A BTC1 Beacon is an abstract mechanism, identified by a ::Beacon Address::, that is included as a service in a DID document to indicate to resolvers that spends from this address, called Beacon Signals, should be checked for ::BTC1 Beacon Announcements::. 

BTC1 Beacons

: ::BTC1 Beacon::


: ::BTC1 Beacon::

Beacon Address
  
: A Beacon Address is a Bitcoin address that has been included in the service of DID document as 
  a service endpoint.

Beacon Signal

: Beacon Signals are Bitcoin transactions that spend from a ::Beacon Address:: 
  and have been included in the Bitcoin blockchain for a specified ::confirmation time::. 
  Beacon Signals anchor in Bitcoin blocktime a small number of bytes, by including 
  a transaction output of the format `[OP_RETURN, <32_bytes>]` in the last transaction 
  output of a Bitcoin transaction. The Beacon Signal bytes commit to one or more 
  ::BTC1 Beacon Announcements::. The ::Beacon Type:: defines how these announcementsa are committed 
  to by a Beacon Signal and the protocol by which these announcements can be verified 
  against the Beacon Signal bytes.

Beacon Signals

: ::Beacon Signal::


Authorized Beacon Signal

: An Authorized Beacon Signal is a ::Beacon Signal:: from a ::BTC1 Beacon:: included 
  in a ::Contemporary DID document:: from the perspective of a resolver executing a resolution request.

BTC1 Beacon Announcement

: BTC1 Beacon Announcements are broadcast by ::BTC1 Beacon::. A BTC1 Beacon Announcement is a SHA256 hash committing 
  to a ::BTC1 Update:: that has been broadcast in an ::Authorized Beacon Signal::. ::Beacon Signals:: 
  can include one or more BTC1 Beacon Announcements. How Beacon Signals include Beacon Announcements
  is defined by the ::Beacon Type::.

BTC1 Beacon Announcements

: ::BTC1 Beacon Announcement::


BTC1 Update

: A capability invocation secured using Data Integrity that invokes an authorization capability to update a specific did:btc1 DID document. 
  The signed payload includes a JavaScript Object Notation (JSON) Patch object defining a set of mutations to the DID document being updated.

BTC1 Updates

: ::BTC1 Update::

Pending BTC1 Update

: A Pending BTC1 Update is a ::BTC1 Update:: that has not yet been announced in an ::Authorized Beacon Signal::.

Pending BTC1 Updates

: ::Pending BTC1 Update::

Announced BTC1 Update

: An Announced BTC1 Update is a ::BTC1 Update:: that has been announced in an ::Authorized Beacon Signal:: 
which has met the specified threshold for confirmation.

Announced BTC1 Updates

: ::Announced BTC1 Update::

Beacon Type

: The type of a ::BTC1 Beacon::. The Beacon Type defines how ::BTC1 Beacon Announcements:: 
  are included within a ::Beacon Signal:: broadcast on the Bitcoin network. It also defines 
  how the content committed within ::BTC1 Beacon Announcements:: can be verified 
  against the ::Beacon Signal::.


Singleton Beacon

: A type of ::BTC1 Beacon:: whose ::Beacon Signals:: each contain a single ::BTC1 Beacon Announcement::.

Map Beacon

: A type of ::BTC1 Beacon:: which aggregates multiple ::BTC1 Beacon Announcements::. 
  A ::Beacon Signal:: from a Map Beacon commits to a ::Beacon Announcement Map::.


Beacon Announcement Map

: A document that maps did:btc1 identifiers to ::BTC1 Beacon Announcements::. 
  This is used to distinguish which ::BTC1 Beacon Announcement:: applies to which 
  did:btc1 identifier.

SMT Beacon

: A type of ::BTC1 Beacon:: which aggregates multiple ::BTC1 Beacon Announcements::.  
  A Beacon Signal from an SMT Beacon contains the root of an optimized sparse Merkle tree.

Beacon Cohort

: The set of unique cryptographic keys participating in a ::BTC1 Beacon:: that are required to
authorize spends from the ::Beacon Address::.


Beacon Aggregator

: The entity that coordinates the protocols of an aggregate ::BTC1 Beacon::. 
Specifically the Create Beacon Cohort and Announce Beacon Signal protocols.


Beacon Participant

: A member of a ::Beacon Cohort::, typically a DID controller, that controls cryptographic keys required 
to partially authorize spends from a ::Beacon Address::.


Sparse Merkle Tree

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
  attested to at the leaves of the tree is the ::BTC1 Update:: for that
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
  updates. A DID document's contemporary time is the blockheight of the ::Beacon Signal::
  that announced the last ::BTC1 Update:: applied to the DID document.

Contemporary DID document

: A DID document that is current at a specific ::Contemporary Blockheight::. DID Resolvers
track the Contemporary DID document of a did:btc1 identifier through Bitcoin block time
during the process of resolution.

Intermediate DID Document

: A representation of a DID document that it not yet fully conformant with the DID Core
  specification. Intermediate DID documents for the did:btc1 DID method are DID documents
  whose identifier values have been replaced with a placeholder value.

Initial DID Document

: The canonical, conformant version 1 of a DID document for a specific did:btc1 identifier.

Initial DID Documents

: ::Initial DID Document::
