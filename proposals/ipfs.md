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
* 0x12, the [multihash](https://github.com/multiformats/multihash) code for SHA2-256; and
* the SHA2-256 of the file.

The stringified version of the CIDv1 is accomplished using [multibase](https://github.com/multiformats/multibase) encoding. The final URL is “ipfs://&lt;stringified CIDv1>”.

### Recommendation

Much of the documentation for **did:btc1** is written proposing IPFS as a viable Content Addressable Storage (CAS) medium, leaving the ultimate selection open to implementers. This is an ambiguity that can cause problems for implementers if another viable CAS is introduced.

It is recommended that this ambiguity be removed and that IPFS be the only CAS supported by **did:btc1**. If another, viable CAS is introduced, it should be supported by a future version, with the generic hash encoding "x1" replaced with "i1" (for IPFS), adding a different indicator for each new CAS. Furthermore, the value following the "i1" indicator should be a stringified CIDv1.

This does *not* require that any of the files be stored in IPFS, only that they be identified using the CIDv1 mechanism.
