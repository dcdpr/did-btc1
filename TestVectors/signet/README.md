# did:btc1 Signet Test Vectors

This folder contains test vectors for **did:btc1** identifiers registered on the main signet network used by Bitcoin - [https://mempool.space/signet](https://mempool.space/signet)

To connect to a public esplora API for this signet network use: `https://mempool.space/signet/api`

The test vectors are:

- `did:btc1:k1qypa5tq86fzrl0ez32nh8e0ks4tzzkxnnmn8tdvxk04ahzt70u09dagl0mgs4` : This is an example of late publishing. However, the resolutionOptions set a versionTime that is before the late publishing occurs. **Remove the version time to check you catch the late publishing error.**
- `did:btc1:x1qyj23twdpn927d5ky2f5ulgmr9uudq2pd08gxy05fdjzxvfclzn2zazps8w`