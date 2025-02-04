## Security Considerations

### did:btc1 Design Considerations

#### Late Publishing

**did:btc1** was designed to avoid Late Publishing such that, independent of when
a resolution occurs, the DID document history and provenance is guaranteed to
be invariant. This is achieved through requiring strict ordering of DID updates
and complete coverage of all relevant Beacon Signals. Resolvers MUST process all
relevant Beacon Signals and enforce strict ordering.

#### Invalidation Attacks

Invalidation attacks are where adversaries are able to publish Beacon Signals
that claim to contain updates for DIDs they do not control. Due to the requirement
for complete coverage, if these updates can not be retrieved by a resolver, the
DID MUST be considered invalid. To prevent these attacks, all Beacon Signals SHOULD
be authorized by all cohort participants using an n-of-n multi-signature. That
way DID controllers can verify the updates announced within a Beacon Signal
before authorizing it.


### Considerations Deploying did:btc1

#### Data Retention

**did:btc1** requires resolvers to have complete coverage of all relevant Beacon
Signals and the associated updates for a specific **did:btc1** to prevent Late
Publishing. This means that the updates MUST be available to resolver at the
time of resolution. It is the responsibility of DID controllers to persist this
data, otherwise the consequence is that the DID MAY not be resolvable (depending
on data accessibility from the perspective of the resolver).  DID controllers
MAY store DID Update Payloads on a Content Addressable Storage (CAS) system. DID
controllers SHOULD consider that in some constrained environments it is preferable
to discard a DID and replace it with a newly issued DID, rather than rotating
a key.

#### Aggregator Beacon Address Verification

An Aggregator Beacon Address SHOULD be an n-of-n Pay-to-Taproot (P2TR) address,
with a cohort key contributed to the n by each of the cohort participants. DID
controllers participating in aggregation cohorts SHOULD verify the Beacon address
is an n-of-n and that one of the n keys is the cohort key provided to the Beacon
coordinator. This can be achieved only by constructing the address for themselves
from the set of cohort keys which the coordinator SHOULD provide.


#### Aggregator Beacon Signal Verification

Beacon Signals from Aggregators that a DID controller is a participant of will
either announce an update for their DID or will contain no update for their DID.
The DID controller SHOULD verify that the Beacon Signal announces the update they
expect (or no update) for all Beacon Signals broadcast by Aggregators before
authorizing them. If they do not, then invalidation attacks become possible where
a Beacon Signal announces an update for a DID that cannot be retrieved, causing
the DID to be invalidated.

#### Key Compromise

In **did:btc1**, cryptographic keys authorize both DID updates and Beacon Signals.
Should these keys get compromised without the DID controller's knowledge, it
would be possible for an adversary to take control of a DID by submitting a DID
Update Payload to a Beacon that replaces key material and Beacons in the DID
document for ones under the adversary's control. Such an attack would be detectable
by the DID controller, as they would see a valid spend from a Beacon that they
did not authorize. Additionally, if the DID relied on Sidecar data, without access
to this data the DID would be useless to the adversary as they would be unable
to demonstrate a valid complete history of the DID during resolution.

#### Cryptographic Compromise

The security of **did:btc1** identifiers depends on the security of Schnorr
signatures over the secp256k1 curve. It is this signature scheme that is used
to secure both the Beacon Signals and DID Update Payloads. Should vulnerabilities
be discovered in this scheme or if advancements in quantum computing compromise
its cryptographic foundations, the **did:btc1** method would become obsolete.

#### Bitcoin Blockchain Compromise

The security of **did:btc1** identifiers depends on the security of the Bitcoin
blockchain. Should the Bitcoin blockchain become compromised such that its history
could be rewritten, for example through a 51% attack, then Beacon Signals that
were once part of the blockchain could be removed or replaced--although the longer
these Signals have been included in the blockchain the more difficult this becomes.
A 51% attack could prevent future Beacon Signals from being included within the
network, however this would require the 51% attack to remain indefinitely enforced.
Furthermore, without Key Compromise related to a specific DID, the compromise
of the Bitcoin blockchain would not enable adversarial parties to take control
of a DID.
