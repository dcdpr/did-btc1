# did:btc1 Regtest Test Vectors

This folder contains a set of test vectors for **did:btc1** identifiers registered on a local regtest network. The state of that network is contains in the `did-btc1-electrs.polar.zip` folder.

## Connecting to the regtest network

1. First, extract the `did-btc1-electrs.polar.zip` folder somewhere.
2. cd into the extracted folder
3. Run `docker-compose up`
4. Verify the network is running with electrs. Go to `http://localhost:3000/blocks` and a list of json objects representing bitcoin blocks should be returned.

Alternatively, the zip file can be dragged into the [lighting polar](https://lightningpolar.com/) app, if it is installed. Then the network can be started through the apps interface. However, doing this may drop the electrs part of the docker file. If this happens, view the docker-compose file in the `did-btc1-electrs.polar.zip` folder and copy across into the polar docker compose. Polar networks can be found under `~/.polar/networks`.

## Running the test

Using a did:btc1 Resolver, you should be able to resolve the test vectors under the `regtest` folder. At the moment, each test vectors is expected to succeed. 

You should configure your resolver to query the electrs API at `http://localhost:3000.

Each test vector is in a folder named after the method specific identifier of the vector. Each folder contains:

1. `did.txt` - The **did:btc1** identifier to be resolved
2. `resolutionOptions.json` - A resolution options object to be passed into the resolver. Typically contains necessary sidecar data.
3. `initialDidDoc.json` - The initial DID Document for the **did:btc1** identifier.
4. `intermediateDidDoc.json` - If the **did:btc1** identifier is external (starts with x1), then this is the intermediate DID document that was used to produce the method specific identifier.
5. `keys.json` - A set of hex encoded public and private keypairs used by the DID controller. These are mapped to an identified element of the DID document. E.g. a beacon service
6. `targetDidDocument.json` - The result you should get after resolving the identifier. TODO: Update this to resolutionResult.json
7. Additionally, there may be a set of folders labeled `blockXXX` where `XXX` is a number. This is the data relevant to an update the was broadcast in a beacon signal which your resolver should locate in the bitcoin block `XXX`. Each block folder contains:
  1. `updates.json` - a List of updates found in beacon signals at `blockXXX`. Typically one, but can be more.
  2. `canonicalUpdatePayload.txt` - The JCS canonicalization of the DID document being updated
  3. `documentHashHex.txt` - The hex represetnation of the hash of the update
  4. `contemporaryDidDocument.json` - The DID document after applying the updates in the `updates.json`

The contents of the TestVectors is a work in progress. The idea is that to run the test you need to take the `did.txt` and `resolutionOptions.txt` which should resolve to a `targetDidDocument.json` (resolutionResult actually). If you are not getting this, then you can use the additional information to debug and see where we have differences.