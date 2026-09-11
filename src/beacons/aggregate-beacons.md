{% import "includes/links.tera" as links %}

{{ links::include(root="../") }}


# Aggregate Beacons

DID controllers can use a [CAS Beacon], an [SMT Beacon], or both to participate in [BTCR2 Update] Aggregation. In contrast to a [Singleton Beacon], which only allows for one [BTCR2 Update] per Bitcoin transaction, [Aggregate Beacons][Aggregate Beacon] combine multiple [BTCR2 Updates][BTCR2 Update] into one Bitcoin transaction for any number of DID controllers. In this context, DID BTCR2 controllers are called [Aggregation Participants][Aggregation Participant].

## BTCR2 Update Aggregation

[BTCR2 Update] Aggregation is the coordination protocol used by an [Aggregation Service] and [Aggregation Participants][Aggregation Participant] to perform aggregation. A full protocol definition is out of scope for this specification, but a RECOMMENDED example is provided for illustration.

## Example Using Musig2, secp256k1, and Schnorr Signatures

One implementation, centered on [Schnorr Signatures][Schnorr Signature], allows all [Aggregation Participants][Aggregation Participant] to veto any [Beacon Signal] for which their own proof data does not match the proposed `OP_RETURN` data. DID controllers that wish to join an [Aggregation Cohort] and become an [Aggregation Participant] would need to provide the [Aggregation Service] with a Schnorr public key.

The [Aggregation Service] coordinates the construction of an `n-of-n` Pay-to-Taproot (P2TR) address as the [Beacon Address], where each [Aggregation Participant's][Aggregation Participant] public key is one of the `n` keys. This ensures that all on-chain [Beacon Signals][Beacon Signal] are cryptographically signed by every [Aggregation Participant], while the [Aggregation Service] remains minimally trusted.

An [Aggregation Cohort] may fail if [Aggregation Participants][Aggregation Participant] stop participating or the [Aggregation Service] is compromised. If that happens, the [Aggregate Beacon] simply fails to broadcast [Beacon Signals][Beacon Signal] that announce [BTCR2 Updates][BTCR2 Update].

The [Aggregation Service] decides when to finalize the membership of the [Aggregation Cohort]. After it does, it computes an `n-of-n` Pay-to-Taproot (P2TR) address from the public keys the [Aggregation Participants][Aggregation Participant] provided. This [Beacon Address] must be sent to all [Aggregation Participants][Aggregation Participant] with the set of keys used to construct it. Each [Aggregation Participant] should verify the address and confirm that their key is included.

Once the [Aggregation Participants][Aggregation Participant] have verified the newly formed [Beacon Address], they can construct the `service` object that can be included within their DID document's service array.

This RECOMMENDED setup ensures that neither the [Aggregation Service] nor other [Aggregation Participants][Aggregation Participant] can compromise or invalidate a **did:btcr2** identifier of another [Aggregation Participant] in the cohort.

The actors involved in aggregation are as follows:

* DID controller - A party that controls one or more **did:btcr2** identifiers;
* [Aggregation Participant] - A DID controller in the [BTCR2 Update] Aggregation context after joining an [Aggregation Cohort];
* [Aggregation Cohort] - A set of [Aggregation Participants][Aggregation Participant] who have submitted cryptographic material to an [Aggregation Service];
* [Aggregation Service] - A single entity who coordinates the protocols and is ultimately responsible for broadcasting the [Beacon Signal] formed as a result of [BTCR2 Update] Aggregation; and
* Verifier - A party verifying a **did:btcr2** identifier presentation.

### Step 1: Create Aggregation Cohort

Creating an [Aggregation Cohort] requires that the [Aggregation Service] define the conditions for it, advertise the new cohort to prospective [Aggregation Participants][Aggregation Participant], and accept enrollment.

When defining an [Aggregation Cohort], the [Aggregation Service] can define conditions such as:

* [Beacon Type] ([CAS] or [SMT]);
* Minimum and/or maximum number of [Aggregation Participants][Aggregation Participant];
* Minimum and/or maximum number of DIDs per [Aggregation Participant];
* Cost of enrollment;
* Cost per announcement per DID or [Aggregation Participant];
* Minimum and/or maximum time between announcements; and
* Number of pending updates that trigger an announcement.

Advertising [Aggregation Cohorts][Aggregation Cohort] to participants can be done with Nostr or DIDComm.

Enrolling in an [Aggregation Cohort] requires exchanging DIDs or indexes (hashes of DIDs) and the public keys used to create the `n-of-n` MuSig2 Bitcoin address.

### Step 2: Announcing Update Opportunities

After the [Aggregation Cohort] is created, an [Aggregation Service] MAY choose between two flows for presenting and engaging with update opportunities:

1. Pull Flow: [Aggregation Service] periodically announces update opportunities to [Aggregation Participants][Aggregation Participant]; or
2. Push Flow: [Aggregation Participants][Aggregation Participant] send updates to the [Aggregation Service] when ready.

The cohort definition states which flow applies.

All [Aggregation Participants][Aggregation Participant] must be made aware of each opportunity because every participant must respond for the [Aggregation Service] to broadcast [Beacon Signals][Beacon Signal].

#### Respond to Update Opportunities

[Aggregation Participants][Aggregation Participant] must submit a response to every update opportunity announced by the [Aggregation Service]; otherwise the [Aggregation Service] cannot broadcast [Beacon Signals][Beacon Signal]. This response must include:

* For a [CAS Beacon]:
    * Either a negative acknowledgement (for no update to be included);
    * Or:
        * `did`: The DID to be updated
        * `updateHash`: The SHA-256 hash of the [BTCR2 Update] to be included, created with the [JSON Document Hashing] algorithm. (I.e., `json_document_hash(update)`) 
    * MuSig2 Nonce: A MuSig2 nonce constructed according to the nonce generation algorithm specified in {{#cite BIP327}}.

* For an [SMT Beacon]:
    * `didIndex`: The SHA-256 hash of the DID to be updated;
    * `updateHash`:
        * If there is an update:
            * If a `nonce` is used: `hash(hash(nonce) + updateId)`
            * If a `nonce` is not used: `updateId`
        * If there is not an update:
            * If a `nonce` is used: `hash(hash(nonce))`
            * If a `nonce` is not used: no value, the index stays empty and its leaf value is `cachedZero[0]`
    * Participants MUST persist their `nonce` values.
    * MuSig2 Nonce: A MuSig2 nonce constructed according to the nonce generation algorithm specified in {{#cite BIP327}}.

This response SHOULD be sent over a secure communication channel and MAY be signed.

Once responses to an update opportunity are collected, the [Aggregation Service] can prepare a candidate [Beacon Signal] for confirmation by the cohort.

### Step 3: Aggregate & Request Signal Confirmation

Once the [Aggregation Service] has received responses to an update opportunity from all [Aggregation Participants][Aggregation Participant] in the [Aggregation Cohort], it aggregates the update announcements into an [Unsigned Beacon Signal]. All [Aggregation Participants][Aggregation Participant] MUST respond. The [Aggregation Service] needs every update/no-update decision and every MuSig2 nonce to build the complete signal payloads and the `n-of-n` aggregated nonce. It then sends this signal, along with the information required to confirm its construction, to each [Aggregation Participant]. The [Aggregation Service] also combines the MuSig2 nonces from each [Aggregation Participant] following the nonce aggregation algorithm in {{#cite BIP327}}.

Aggregation of updates into a [Beacon Signal] depends on the type of [BTCR2 Beacon]:

* For [CAS Beacons][CAS Beacon], the [Aggregation Service] creates a [Beacon Announcement Map] that maps [Aggregation Participant]-provided indexes to [BTCR2 Update Announcements][BTCR2 Update Announcement]. The [Signal Bytes] included in a [CAS Beacon] Signal is the SHA-256 hash of the [Beacon Announcement Map].

* For [SMT Beacons][SMT Beacon], the [Aggregation Service] constructs a [Sparse Merkle Tree] (SMT) whose leaves pair each registered index with the value submitted for that index. Every registered index MUST appear as a leaf. After constructing the [SMT], the [Aggregation Service] optimizes the tree and generates [SMT Proofs][SMT Proof] for each index to share with the corresponding [Aggregation Participant]. The [Signal Bytes] of an [SMT Beacon] Signal is the 32 byte [SMT] root.

For a [CAS Beacon], the request signal confirmation message contains:

* The [Beacon Announcement Map];
* The [Unsigned Beacon Signal]; and
* The MuSig2 aggregated nonce.

For an [SMT Beacon], the request signal confirmation message contains:

* An [SMT Proof] for each index belonging to the [Aggregation Participant];
* The [Unsigned Beacon Signal]; and
* The MuSig2 aggregated nonce.

#### Confirm Signal Request

The [Aggregation Participant] must validate the contents of the [Beacon Signal] (partially signed transaction) according to the type of the [BTCR2 Beacon]:

* For a [CAS Beacon], the [Aggregation Participant] checks that every registered index appears only when a [BTCR2 Update] was submitted and that each mapped value matches the [BTCR2 Update Announcements][BTCR2 Update Announcement] they submitted. [Aggregation Participants][Aggregation Participant] MUST also check that the [Signal Bytes] of the [Beacon Signal] contains the SHA-256 hash of the [Beacon Announcement Map].

* For an [SMT Beacon], the [Aggregation Participant] validates that all the indexes registered with the [Aggregation Service] have [SMT Proofs][SMT Proof] and that the [SMT Proofs][SMT Proof] are valid proofs of the values they submitted to the [Aggregation Service]. The [Signal Bytes] in the [Beacon Signal] MUST be used as the [SMT] root to verify these proofs.

Once the [Aggregation Participant] is satisfied that the [Beacon Signal] only announces the [BTCR2 Updates][BTCR2 Update] they submitted for DIDs they control, they partially sign the Bitcoin transaction according to the signing algorithm specified in {{#cite BIP327}}. [Aggregation Participants][Aggregation Participant] use the private key that matches the public key they provided when joining the [Aggregation Cohort] and the MuSig2 aggregated nonce provided by the [Aggregation Service]. Finally, [Aggregation Participants][Aggregation Participant] return the partially signed Bitcoin transaction to the [Aggregation Service], confirming the [Beacon Signal].

[Aggregation Participants][Aggregation Participant] SHOULD maintain the set of data required to validate their [BTCR2 Updates][BTCR2 Update] against the [Beacon Signal].

* For [CAS Beacon] Signals, this means persisting the [Beacon Announcement Map] and the [BTCR2 Updates][BTCR2 Update] announced within that map for indexes that they control.
* For [SMT Beacon] Signals, [Aggregation Participants][Aggregation Participant] must persist the [BTCR2 Updates][BTCR2 Update], nonce values, and [SMT Proofs][SMT Proof] for each index they control.

### Step 4: Broadcast Aggregated Signal

After the [Aggregation Service] receives confirmation of the [Beacon Signal] from all [Aggregation Participants][Aggregation Participant] within the [Aggregation Cohort], it finalizes the signature on the [Beacon Signal]. Each confirmation contains a partial signature. The [Aggregation Service] aggregates these partial signatures to create a final signature that spends the [Unspent Transaction Output] (UTXO) controlled by the [Beacon Address] input in the [Beacon Signal].

Aggregation of partial signatures is done following the partial signature aggregation algorithm specified in {{#cite BIP327}}. The result is a signed Bitcoin transaction. The [Aggregation Service] then broadcasts this transaction onto the Bitcoin network.
