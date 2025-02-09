## Introduction and Motivation

Public digital identity was introduced to the Internet through PGP's foundational
legal work in the 1990s. Since the late 2010s, with Decentralized Identifiers,
digital identity can be preserved through a rotation of key material, without
relying on a centralized party. The first DID Method anchoring on the Bitcoin
blockchain, did:btcr, focused on censorship resistance. However, self-sovereign
identity is not complete without options for privacy as well, and the initial
promise of privacy in the DID ecosystem was dubious, with heavy reliance on
public DID documents.

There is a mitigation available even where some knowledge is public.
Application designers can focus on mitigating correlation using "Pairwise DIDs",
which are DIDs created for every different special purpose that MAY occur. This
includes not only a new DID created for every new person one starts a conversation
with, but also every business that one transacts with, every group that one
joins, and every online task that requires managing identity or key material.

In order to tackle reliance on public DID documents head-on, this DID Method
introduces private DID Documents. However, if "private" or "pairwise" DID
documents leak every time the DID is used then these DIDs do not accomplish
much, either. DIDs that are shared with a relying party can be seen by not only
that party but also by any third party resolver that the relying party contracts
with. The next step in trust-minimization is a DID document transferred directly
from the DID controller to the relying party.We call this transfer "::Sidecar::"
delivery.When a relying party *who is willing to cooperate with privacy concerns*
has the capacity to act as their own resolver, then privacy has a chance.

Lastly, many DID Methods do not anchor DID documents temporally, to create a
chain-of-custody. Instead, they leave them on media that can be used to rewrite
history. Bitcoin's blockchain is the premiere global database for immutably
anchoring information to a specific time. This DID Method takes care to only
allow resolution to succeed when the resolver can clearly state that all data is
available to present only one canonical history for a DID. This is a necessary
feature when key material is used to sign serious contracts. We call this feature
"::Non-Repudiation::", and point out how an anti-feature called "::Late Publishing::"
affects some other DID Methods.

**did:btc1** is created for those who wish to have it all:
* resistance to censorship;
* non-correlation through pairwise DIDs;
* private communication of the DID document;
* a closed loop on private DID resolution;
* efficiency (in cost and energy usage), via offline DID creation and aggregatable
  updates;
* long-term identifiers that can support frequent updates; and
* ::Non-Repudiation:: appropriate for serious contracts.

### Comparison with Other DID Methods that Rely on Bitcoin's Blockchain for Anchoring

#### did:btcr

BTCR is the original Bitcoin DID Method.  It kept its focus on censorship
resistance. It has the following limitations:
* It is prohibitively expensive to maintain many DIDs, because both creation and
  every update require a separate on-chain transaction.
* It requires storing the data for the DID document somewhere public and exposed
  via OP_RETURN: either at a URL, or accessible via content-addressed storage such
  as IPFS.
* Once a DID document has been revealed as connected to a transaction, it could
  be possible for colluding miners to target the controlling funds for censorship,
  which might block updates (although this is currently highly unlikely since no
  valid transaction has ever been successfully censored from the blockchain by
  miners).
* When all the prior updates were kept online, BTCR provided ::Non-Repudiation::,
  however it is possible to take prior updates offline and still resolve the
  current BTCR update as a valid DID Document, so it cannot guarantee ::Non-Repudiation::.

#### did:ion

ION anchors on the Bitcoin blockchain following a Sidetree approach. It has the
following limitations:
* Although in the normal case where data is available this DID Method performs
  fine, it does not fully address the ::Late Publishing:: problem, and thus attackers
  may manipulate edge cases to create doubt about signatures used for attestation.
* It stores DID documents on IPFS, and thus does not allow keeping the DID document
  private between the DID controller and a relying party, even if they are capable of
  their own did:ion resolution.

#### did:btco

This DID Method stores the entire DID document on-chain in transactions using
"inscriptions".  Because of this, its main feature of totally on-chain data is
also its main structural limitation:
* Those transactions are very expensive.
* They cannot be kept private.

#### did:btc

This DID Method is like did:btco in that it also uses inscriptions. It adds a
batching mechanism that reduces overhead but still stores all data on-chain.
Its documentation lists "subject keys" as a feature, but they are just talking
about defining additional keys in a DID document, which all of these DID Methods
provide. In summary its main limitations are:
* Creation and update require expensive transactions.
* did:btc does not contemplate a way to keep DID documents private.

#### did:btc1

### Features

* There is no proprietary blockchain, only the Bitcoin blockchain.
* ::Offline Creation:: allows creating DIDs without any on-chain transactions.
* Aggregator Beacons can aggregate any number of updates from any number of DID
  controllers in one Bitcoin transaction.
* ::Non-Repudiation:: is provided by - and *"::Late Publishing::"* is avoided by - ensuring
  100% valid coverage of the entire update history without gaps or ambiguity.
* Public disclosure of DID documents can be avoided by using ::Sidecar:: delivery
  of the necessary DID history along with the DID itself.
* Public disclosure of updates to DID documents can also be avoided by only
  recording a ::Sparse Merkle Tree:: (SMT) of proofs of DID updates on-chain.
* Resolvers need only filter transactions likely to contain updates for those
  DIDs of interest.
* Any kind of key can be included in a DID Document, using an update.
* Simple deterministic DIDs can be recovered from typical Bitcoin seed words.

### Limitations
* Resolvers require read-only view of all blocks arriving at the Bitcoin blockchain.
* DID controllers are responsible for providing the data referenced in their
  ::Beacons::' updates (although many ::Beacons:: are expected to provide an archival
  service making Bundles publicly available).  If this data is not available, the
  DID will not verify.
* Because of the data availability responsibility, and the threat of a rogue
  Beacon publishing an invalid reference, the most secure ::Beacons:: will choose
  Bitcoin scripts that allow every DID controller a veto, although given current
  ::UTXO::-sharing technology, this impedes availability.

### Future Directions

* ZCAPs delegation of the right to update only part of a DID Document;
* More scalable Aggregator Beacons will be possible with a "transaction introspection"
  upgrade to Bitcoin, such as OP_CTV or OP_CAT; and
* ::Beacons:: do not have to reuse their addresses if, in the controller's DID document,
  a descriptor is used instead of an address.
