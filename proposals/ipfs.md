# IPFS

## Overview

The Interplanetary File System (IPFS) “is a set of open protocols for addressing, routing, and transferring data on the web, built on the ideas of content addressing and peer-to-peer networking.”

A detailed description is available at the [IPFS documentation site](https://docs.ipfs.tech/), but for the purposes of **did:btc1**, it is a distributed file system where the files are identified using a unique Content Identifier (CID) based on the content of the file. The content of the file determines the CID, and the CID may be used by anyone, anywhere, to retrieve the file.

As with disk-based file systems, it’s not practical to stream an entire file into a contiguous block, so files are broken up into smaller blocks. The entire file is structured as a [Merkle Directed Acyclic Graph (DAG)](https://docs.ipfs.tech/concepts/merkle-dag/), where each node is a block of data and a list of CIDs of its children.

At its simplest, the CID is a cryptographic hash, not of the file, but of its first block. Even if the block has no children, it still has metadata indicating this, so the hash doesn’t equal the hash of the file.

That’s the default behaviour; it’s possible to override the chunking behaviour by storing the file as a raw binary using the [Raw Leaves option](https://richardschneider.github.io/net-ipfs-engine/articles/fs/raw.html). This limits the file size to the block size (default 256 kB, maximum 1 MB), but that should be sufficient for most applications.

## Integration with **did:btc1**

Files stored in IPFS SHALL be stored using the Raw Leaves option.

The IPFS CIDv1 is a binary identifier constructed from the file hash as:

* 0x01, the code for CIDv1;
* 0x00, the [multicodec](https://github.com/multiformats/multicodec) code for raw binary;
* 0x12, the [multihash](https://github.com/multiformats/multihash) code for SHA-256; and
* the SHA-256 of the file.

The stringified version of the CIDv1 is accomplished using [multibase](https://github.com/multiformats/multibase) encoding. The final URL is “ipfs://&lt;stringified CIDv1&gt;”.

## Options

Much of the documentation for **did:btc1** is written proposing IPFS as the Content Addressable Storage (CAS) medium, leaving the ultimate selection open to implementers. This is an ambiguity that can cause problems for implementers if another viable CAS is introduced.

Note that none of these options require that files be stored in any CAS; they all support sidecar delivery.

### SHA-256 only, any CAS

This option is the way things are now. The "external" ID type supports only SHA-256 (though "Syntax.md" needs to be updated to reflect this) and IPFS is suggested but any CAS may be used if not using the sidecar method.

This requires a deterministic mapping from the SHA-256 hash to the CAS URL, which is not supported by every CAS.

### SHA-256 only, IPFS only

The "external" ID type supports only SHA-256 and IPFS is the only CAS supported if not using the sidecar method. The addition of any other CAS would require a new hash encoding prefix. Furthermore, the "external" ID type should be changed to "IPFS" and the "x1" hash encoding prefix changed to "i1".

This would simplify the specification and subsequent implementations, but would require reopening the specification to support another CAS.

### CIDv1 alignment

The "external" ID type is replaced with "CIDv1", the "x1" hash encoding prefix is changed to "c1", and the content following the prefix is the Bech32m encoding of the raw CIDv1. The file may be stored in IPFS or delivered using the sidecar mechanism.

This provides complete alignment with IPFS (support for large files, support for other hash algorithms, easy mapping to/from IPFS URLs) but comes with the complexity of integrating a CIDv1 encoding/decoding library into any application.

### Separation of CAS and "external" ID

The "external" ID type remains and supports only sidecar delivery. IPFS and other CAS protocols are adding individual encodings.
