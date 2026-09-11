{% import "includes/links.tera" as links %}

{{ links::include() }}


# Beacons

A [BTCR2 Beacon] is a service listed in a BTCR2 DID document that informs resolvers how to find authentic updates to the DID. The service properties define a Bitcoin address to watch for [Beacon Signals][Beacon Signal].

The resolver MUST process each [Beacon Signal] that [Find Beacon Signals](operations/resolve.md#find-beacon-signals) finds for the [Current DID Document]. The [Beacon Type] in the service defines how [Beacon Signals][Beacon Signal] MUST be processed.

Any on-chain [Beacon Signal] that cannot be processed renders the related DID invalid. For this reason, all DID controllers SHOULD ensure the [Beacon Addresses][Beacon Address] they include in their DID document require appropriate approval to spend [UTXOs][UTXO] controlled by the address, so that only approved [Beacon Signals][Beacon Signal] can be posted to Bitcoin. For resilience, BTCR2 DIDs can specify any number of [Beacons][BTCR2 Beacon] and SHOULD include at least one [Singleton Beacon] as a fallback in case all [Aggregate Beacons][Aggregate Beacon] fail.

A [Beacon Signal] commits to, and anchors in a Bitcoin block, 32 bytes of information. These [Signal Bytes] represent one of the following:

* A [BTCR2 Update Announcement];
* The hash of a [Beacon Announcement Map]; or
* The 32 bytes of an optimized [Sparse Merkle Tree] root, where each leaf node is deterministically selected by a **did:btcr2** identifier and contains a hash associated with the **did:btcr2** identifier.

**did:btcr2** supports different [Beacon Types][Beacon Type], with each type defining a set of algorithms for:

* How a [BTCR2 Beacon] can be established and added as a service to a DID document.
* How [BTCR2 Update Announcements][BTCR2 Update Announcement] are broadcast within [Beacon Signals][Beacon Signal].
* How a resolver processes [Beacon Signals][Beacon Signal], identifying, verifying, and applying the authorized mutations to a DID document for a specific DID.

The current, active, [BTCR2 Beacons][BTCR2 Beacon] of a DID document are specified in the document's `service` property. By updating the DID document, a DID controller can change the set of [BTCR2 Beacons][BTCR2 Beacon] they use to broadcast updates to their DID document over time. Resolution of a DID MUST process signals from all [BTCR2 Beacons][BTCR2 Beacon] identified in the [Current DID Document] and apply them in the order determined by the `targetVersionId` declared in the [BTCR2 Signed Update (data structure)].

All **did:btcr2** DID resolvers MUST support the [Beacon Types][Beacon Type] defined in this specification.


## Table 1: Beacon Types { #beacon-types }

| Service `type`      | Beacon Type        |
|:--------------------|:-------------------|
| `"SingletonBeacon"` | [Singleton Beacon] |
| `"CASBeacon"`       | [CAS Beacon]       |
| `"SMTBeacon"`       | [SMT Beacon]       |


## Singleton Beacon

A [Singleton Beacon] is a [BTCR2 Beacon] that can be used to announce commitments to a single [BTCR2 Update] targeting a single DID document. It creates a [Beacon Signal] that commits to a single [BTCR2 Update Announcement]. This is typically done directly by the DID controller, as there is no [Aggregation Cohort].

If the [BTCR2 Update] committed to by the [BTCR2 Update Announcement] is not publicly discoverable (i.e., is not published to a [CAS] under its hash), the only parties that are aware of it are the DID controller and any parties provided it by the DID controller.

The `type` of a `service` defining a [Singleton Beacon] in a DID document is `"SingletonBeacon"`.


## CAS Beacon

A [CAS Beacon] creates a [Beacon Signal] that commits to multiple [BTCR2 Update Announcements][BTCR2 Update Announcement] through a [Beacon Announcement Map]. To do so, it constructs a Map where the key is the **did:btcr2** identifier and the value is the hash of the corresponding [BTCR2 Update]. The [Beacon Signal] contains a SHA-256 hash of the Map.

If a [BTCR2 Update] is not publicly discoverable (i.e., is not published to a [CAS] under its hash), the only parties with access to the update are the DID controller and any parties they gave it to (etc.).

For a [CAS Beacon], proof of non-inclusion of a **did:btcr2** identifier is simply its absence from the Map.

The `type` of a `service` defining a [CAS Beacon] in a DID document is `"CASBeacon"`.


## SMT Beacon

An [SMT Beacon] creates a [Beacon Signal] that commits to multiple [BTCR2 Update Announcements][BTCR2 Update Announcement], each identified by a **did:btcr2** identifier. To do so, it constructs an optimized [Sparse Merkle Tree] as defined in [Appendix: Optimized Sparse Merkle Tree Implementation] and publishes the Merkle root.

An [SMT Beacon] provides maximum privacy for the DID controller, as the DID controller never has to reveal their DIDs to the aggregator. With a `nonce` in the leaf value, the DID controller also does not show if there is a [BTCR2 Update], or its contents. Without a `nonce`, all parties know if there is an update, and all parties can retrieve its contents if the update is on [CAS].

The `type` of a `service` defining an [SMT Beacon] in a DID document is `"SMTBeacon"`.
