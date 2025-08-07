## File Sharing

All files in this specification, except for deterministically generated initial
DID documents, are identified by their SHA256 cryptographic hash calculated
according to the [JSON Canonicalization and Hash] algorithm. As a resolver goes
through the resolution process, it encounters one or more document hashes, which
it uses to identify the files of interest. There are two ways in which these
files may be shared: through a sidecar mechanism or using content-addressable storage.

While it's possible for a single **did:btc1** identifier to mix the two file
sharing mechanisms, it is not recommended.

### Sidecar

Sidecar is a mechanism by which a file is provided alongside the **did:btc1**
identifier being resolved. This is analogous to a sidecar on a motorcycle
bringing along a second passenger: the DID controller provides the DID Document
history (in the form of JSON Patch transformations) alongside the DID to the
relying party so that the resolver can construct the DID Document.

In short, when a resolver is presented with a **did:btc1** identifier, it is
also presented with files matching the SHA256 hashes it encounters during the
resolution process. If any SHA256 hash doesn't have a corresponding file, the
resolution fails.

### Content-Addressable Storage (CAS)

Content-Addressable Storage (CAS) is a mechanism by which a file stored is addressed by its content, not its name or location. The content address is
determined by a cryptographic hash of the file. The hash is then passed into a
retrieval function specific to the type of CAS to retrieve the file.

Any CAS that provides a deterministic mapping from a SHA256 hash of a file may
be used, and a resolver SHOULD be informed of the specific CAS mechanism so that
it can retrieve documents associated with a **did:btc1** identifier efficiently.
If the CAS mechanism is not provided, the resolver MAY iterate through all
supported CAS mechanisms to find the files or it MAY return with an error
indicating that the CAS mechanism is required.

At this time, IPFS is the only known CAS to provide a deterministic mapping from
a SHA256 hash. Others may be documented in future, but the absence of any CAS
from this or any future version of this specification MUST NOT impede its usage,
provided there is agreement between the DID controller, relying party, and
resolver on the use of such an algorithm.

#### Interplanetary File System (IPFS)

The Interplanetary File System (IPFS) “is a set of open protocols for
addressing, routing, and transferring data on the web, built on the ideas of
content addressing and peer-to-peer networking.”

A detailed description is available at the
[IPFS documentation site](https://docs.ipfs.tech/), but for the purposes of
**did:btc1**, it is a distributed file system where the files are identified
using a unique Content Identifier (CID) based on the content of the file. The
content of the file determines the CID, and the CID may be used by anyone,
anywhere, to retrieve the file.

As with disk-based file systems, it’s not practical to stream an entire file
into a contiguous block, so files are broken up into smaller blocks. The entire
file is structured as a
[Merkle Directed Acyclic Graph (DAG)](https://docs.ipfs.tech/concepts/merkle-dag/),
where each node is a block of data and a list of CIDs of its children.

At its simplest, the CID is a cryptographic hash, not of the file, but of its
first block. Even if the block has no children, it still has metadata indicating
this, so the hash doesn’t equal the hash of the file.

That’s the default behaviour; it’s possible to override the chunking behaviour
by storing the file as a raw binary using the
[Raw Leaves option](https://richardschneider.github.io/net-ipfs-engine/articles/fs/raw.html).
This limits the file size to the block size (default 256 kB, maximum 1 MB), but
that should be sufficient for most applications.

For **did:btc1** identifiers, files stored in IPFS SHALL be stored using the Raw
Leaves option.

The IPFS CIDv1 is a binary identifier constructed from the file hash as:

* 0x01, the code for CIDv1;
* 0x00, the [multicodec](https://github.com/multiformats/multicodec) code for 
raw binary;
* 0x12, the [multihash](https://github.com/multiformats/multihash) code for
SHA-256; and
* the SHA-256 of the file.

The stringified version of the CIDv1 is accomplished using
[multibase](https://github.com/multiformats/multibase) encoding. The final URL
is “ipfs://&lt;stringified CIDv1&gt;”.

A resolver retrieves a file associated with a SHA256 hash by constructing the
IPFS CIDv1 per the above algorithm and requesting the file from an IPFS node.
