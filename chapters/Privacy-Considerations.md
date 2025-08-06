## Privacy Considerations

### did:btc1 Design Considerations

#### Updates Need not be Public

**did:btc1** was designed such that updates to Decentralized Identifier (DID) 
documents are NOT REQUIRED to be public. Bitcoin is used to publicly announce 
and anchor updates to DID documents, however the updates themselves can be kept 
private by DID controllers and provided through a ::Sidecar:: mechanism 
at ::Resolution Time::.

#### DID Documents Need not be Public

Since updates to DID documents are NOT REQUIRED to be public, neither are
**did:btc1** DID documents. A **did:btc1** DID document is an initial document
plus a series of updates to that DID document. To keep the DID document fully
private, the DID controller can choose to use an externally resolved initial
**did:btc1** and not place the initial DID document on a ::Content Addressable
Storage:: (CAS) system such as the InterPlanetary File System (IPFS). The initial 
DID document can be provided at ::Resolution Time:: through a ::Sidecar:: mechanism 
along with the collection of updates that can be verified against the 
relevant ::Beacon Signals:: for the DID being resolved.

#### Offline DID Generation

**did:btc1** was designed to support offline DID generation, that is, the
creation of a **did:btc1** identifier and associated DID document without any
network calls to the Bitcoin blockchain. This is possible in both deterministic
and externally resolvable DIDs.

#### Beacon Coordinators do not Need to View or Validate DID Documents or Document Updates

::BTC1 Beacon:: coordinators in **did:btc1** are entities that coordinate ::Aggregate
Beacons:: and the corresponding ::Beacon Signals:: that announce and anchor an aggregated
set of ::BTC1 Updates::. However, in **did:btc1,** Aggregators are able to
coordinate ::Beacon Signals:: without needing to view or validate DID documents or
the updates. Instead, they are provided with a hash or ::Content Identifier:: (CID) 
of the update for a specific DID which they include in the ::Beacon Signal:: 
according to the type of the ::BTC1 Beacon::.

#### Consensus Splits in Implementation can Destroy Non-Repudiation

Because ::Non-Repudiation:: requires following a complete stream of updates to a
DID, any consensus forks in which DID updates to apply can be used to permanently
diverge the history for a DID, and thus the key material, creating alternate
attestation histories.  As a concrete example, a seemingly small difference
between two clients in interpretation of the specification could be used
fraudulently to sign a loan in one history and claim that it was never signed in
another history.

In order to prevent consensus splits, **did:btc1** needs a particularly good
test suite. It MUST be designed to challenge all the foreseeable edge cases as
well as maintained to find new ones.

### Considerations Deploying did:btc1

#### Update Payloads Stored in Content Addressable Storage (CAS) Systems are Publicly Accessible

Update payloads stored in ::Content Addressable Storage:: (CAS) such as IPFS SHOULD
be considered public. Anyone MAY retrieve this information (assuming they have
the ::CID::) and use it to track the DID over time. IPFS node operators would have
access to all content stored on IPFS and could choose to index certain data like
::BTC1 Updates::, including the updates posted by that DID's ::BTC1 Beacon::. This MAY
advertise information about the DID that the controller wishes to remain private.

Those parties most concerned about privacy SHOULD maintain their ::DID Update
Payloads:: in a ::Sidecar:: manner and provide them to necessary parties during
resolution. It is RECOMMENDED not to include any sensitive data other than the
necessary DID update data.

#### Beacon Coordinators Know the DIDs Being Aggregated by a Cohort

Within ::Sparse Merkle Tree:: (SMT) ::BTC1 Beacons::, the DID is used as a path to a leaf
node in the ::SMT::. The coordinator MUST know these paths for them to be able to
construct the tree and generate the correct proof paths. Within ::Content Identifier::
(CID)-based ::BTC1 Beacons::, the coordinator MUST construct an aggregated bundle that
includes all DIDs aggregated as a key to the ::CID:: for that ::DID's Update Payload::.
This means that for both types of ::Aggregate Beacons::, the coordinator necessarily
MUST know all DIDs being aggregated by a cohort.

#### CIDAggregate Cohort Members Know All DIDs that are Updated

Cohort members participating in a CIDAggregate ::BTC1 Beacon:: learn all DIDs that are
updated in each ::Beacon Signal::. This is because they SHOULD verify the contents
of the ::Beacon Signal:: before authorizing it and a CIDAggregate ::Beacon Signal::
contains a ::CID:: to an Update Bundle. An Update Bundle is a JSON object mapping
**did:btc1** identifiers to ::CID:: values for individual ::BTC1 Updates::. Each
DID controller SHOULD independently retrieve and verify the contents of the
Update Bundle to ensure it contains the expected update for their DID.

#### In a System with Non-Repudiation, DID Document History is Revealed

Although it might seem obvious, one of the side effects of using a DID is that
a DID controller's relying party will see their DID Document. In addition,
resolving a DID document requires making available to the resolver all prior
DID document updates.
