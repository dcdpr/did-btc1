## Conformance

As well as sections marked as non-normative, all authoring guidelines, diagrams, examples, and notes in this specification are non-normative. Everything else in this specification is normative.

The key words MAY, MUST, MUST NOT, RECOMMENDED, SHOULD, and SHOULD NOT in this document are to be interpreted as described in BCP 14 [RFC2119](https://www.ietf.org/rfc/rfc2119.txt) [RFC8174](https://datatracker.ietf.org/doc/html/rfc8174) when, and only when, they appear in all capitals, as shown here.

This document contains examples that contain JSON and JSON-LD content. Some of these examples contain characters that are invalid, such as inline comments (//) and the use of ellipsis (...) to denote information that adds little value to the example. Implementers are cautioned to remove this content if they desire to use the information as valid JSON or JSON-LD.

Interoperability of implementations of the **did:btc1** DID method is tested by evaluating an implementation's ability to create and parse **did:btc1** DIDs and DID documents that conform to this specification. Interoperability for producers and consumers of **did:btc1** DIDs and DID documents is provided by ensuring the DIDs and DID documents conform. 

A conforming **did:btc1** DID is any concrete expression of the rules specified in [Syntax] which complies with relevant normative statements in that section.

A conforming **did:btc1** DID document is any concrete expression of the data model described in this specification which complies with the relevant normative statements in DID core sections [4. Data Model](http://w3.org/TR/did-1.1/#data-model) and [5. Core Properties](https://www.w3.org/TR/did-1.1/#core-properties). A serialization format for the conforming document is deterministic, bi-directional, and lossless, as described in [6. Representations](https://www.w3.org/TR/did-1.1/#representations).

A conforming producer is any algorithm realized as software and/or hardware that generates conforming **did:btc1** DIDs or conforming DID Documents and complies with the relevant normative statements in [6. Representations](https://www.w3.org/TR/did-1.1/#representations) of DID core and the [Create], [Update] and [Deactivate] sections of this specification.

A conforming **did:btc1** resolver is any algorithm realized as software and/or hardware that complies with the relevant normative statements in [4. DID Resolution](https://w3c.github.io/did-resolution/#resolving) of the DID Resolution specification and the [Read] section of this specification.

A conforming consumer is any algorithm realized as software and/or hardware that consumes conforming **did:btc1** DIDs or conforming DID documents and complies with the relevant normative statements in [6. Representations](https://www.w3.org/TR/did-1.1/#representations) of the DID core specification.