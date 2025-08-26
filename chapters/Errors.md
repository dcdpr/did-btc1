## Errors

The algorithms described in this specification raise specific types of errors. Implementers might find it useful to convey these errors to other libraries or software systems. This section provides specific URLs and descriptions for the errors, such that an ecosystem implementing technologies described by this specification might interoperate more effectively when errors occur. Additionally, this specification uses some errors defined in Section 10 Errors of the [DID-RESOLUTION] specification. 

Implementers SHOULD use [RFC9457] to encode the error data structure. If [RFC9457] is used:

- The type value of the error object MUST be a URL. Where the values listed in the section below do not define a URL, the values MUST be prepended with the URL https://btc1.dev/ns/error#.
- The title value SHOULD provide a short but specific human-readable string for the error.
- The detail value SHOULD provide a longer human-readable string for the error.

BEACON_NOT_FOUND
: No beacon service found in source document. See Section 4.3.3 Announce DID Update.

INCOMPLETE_SIDECAR_DATA
: Missing sidecar data when processing an aggregate Beacon Signal.

INVALID_BEACON
: A Beacon found in the `services` property of the DID document was of an unrecognized type.

INVALID_DID
: An invalid DID was detected during DID Resolution. See Section 4.4 DID Resolution Algorithm.

INVALID_DID_DOCUMENT
: An external initial document failed to validate as a conformant DID document according to the DID Core 1.1 specification.

INVALID_DID_UPDATE
: Problems when creating or applying a DID Update

INVALID_HRP_VALUE
: An invalid HRP value was found when decoding a **did:btc1** identifier. There are only two valid values: `k` for `key`, and `x` for `external`. See Section 3.2 did:btc1 Identifier Encoding.

INVALID_SIDECAR_DATA
: A DID Update's contents differs from what was expected, and a hash of those contents after canonicalization did not match the hash given in the transaction or DID Update Bundle. 

INVALID_UPDATE_PROOF
: A DID Update failed to apply to a DID document because its `update.proof` was not verified. See Section 4.2.2.5 Apply DID Update.

LATE_PUBLISHING
: An error was found when processing the full history of DID Updates announced by all relevant Beacon Signals. See Section 6.1.1 Late Publishing.

METHOD_NOT_SUPPORTED
: An invalid DID method name was found when decoding a **did:btc1** identifier. See Section 3.3 did:btc1 Identifier Decoding.


