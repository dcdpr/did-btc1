{% import "includes/links.tera" as links %}

{{ links::include() }}


# Errors

The algorithms described in this specification can raise the specific errors listed below. Additional error types defined in the Errors section of DID Resolution v1 {{#cite DID-RESOLUTION}} may also be raised.

These errors are assumed to be fatal and all **did:btcr2** operations must abort when one of these errors are raised.


## `INVALID_DID_UPDATE` { #invalid_did_update }

An error was found when creating or applying a [BTCR2 Update].

## `INVALID_SIGNAL_DATA` { #invalid_signal_data }

The data for a [Beacon Signal] does not agree with its [Signal Bytes]. Example: an [SMT Proof] that does not verify against the [SMT] root in the [Beacon Signal].

## `LATE_PUBLISHING` { #late_publishing }

An error was found when processing the full history of [BTCR2 Updates][BTCR2 Update] announced by all relevant [Beacon Signals][Beacon Signal]. See [Late Publishing].

## `MISSING_UPDATE_DATA` { #missing_update_data }

Data that is necessary to find what a [Beacon Signal] announces for the DID is not in the [Sidecar Data] and not in [CAS]. This data includes [BTCR2 Updates][BTCR2 Update], [CAS Announcements][CAS Announcement (data structure)], and [SMT Proofs][SMT Proof].
