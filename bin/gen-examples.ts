#!/usr/bin/env bun
/**
 * Regenerates every file in src/example-data from the seeds in this file.
 *
 *   bun bin/gen-examples.ts           write the corpus
 *   bun bin/gen-examples.ts --check   verify the committed corpus, write nothing
 *
 * Nothing in the corpus is hand-written, and every step the reference
 * implementation covers is performed by the reference implementation. The
 * @did-btcr2/api SDK is the entry point and does as much as it reaches:
 * identifiers, key pairs, multikeys, Data Integrity proofs, and the DID document
 * classes it re-exports. The packages under it supply what it does not surface,
 * listed at the import block. Every proof is verified and every hash is recomputed
 * before anything is written, so a run that succeeds has verified the corpus
 * rather than just serialized it. Where the implementation has not caught up to
 * the specification, the specification wins and the difference is marked GAP.
 * There are five. GAP 3 is one theme, the order of JSON properties, and it
 * appears at two sites. JCS sorts member names, so property order never
 * changes a hash; the reorder only makes the committed files read in the order
 * the specification lists. GAP 5 is the Sparse Merkle Tree: the package has two
 * leaf arms, a required `nonce`, and the other bit order, so this script builds
 * the tree, the proofs, and the verifier itself from the package's hashed-zero
 * cache and helpers.
 *
 * Runs are reproducible: secret keys are SHA-256 of their seed string and BIP340
 * aux_rand is SHA-256 of a per-signature label. Changing either changes every
 * proofValue in the corpus, so leave them pinned.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// The SDK covers identifiers, key pairs, multikeys, and Data Integrity proofs, and
// re-exports the DID document classes. The imports below it are used only for the
// parts the SDK does not cover: the update operation (`DidMethodApi.update` and
// `UpdateBuilder.execute` both broadcast a Bitcoin transaction, and this corpus is
// not anchored to a chain), Beacon Services, root capability derivation, hashing and
// patching, and the Sparse Merkle Tree, which the SDK does not expose.
import type { DidVerificationMethod, PatchOperation } from '@did-btcr2/api';
import { createApi, DidDocument, GenesisDocument, IdentifierTypes } from '@did-btcr2/api';
import { getNetwork } from '@did-btcr2/bitcoin';
import { canonicalHash, canonicalize, JSONPatch } from '@did-btcr2/common';
import type { Signer, SchnorrKeyPair, SigningScheme } from '@did-btcr2/keypair';
import type { BeaconService } from '@did-btcr2/method';
import { Appendix, BeaconUtils, Updater } from '@did-btcr2/method';
import {
  base64UrlToHash,
  bigIntToHash,
  blockHash,
  CACHED_ZERO,
  didToIndex,
  hashToBase64Url,
  hashToBigInt,
} from '@did-btcr2/smt';
import { schnorr } from '@noble/curves/secp256k1';
import { sha256 } from '@noble/hashes/sha2';
import { utf8ToBytes } from '@noble/hashes/utils';
import { p2pkh, p2tr, p2wpkh } from '@scure/btc-signer';

const EXAMPLES = new URL('../src/example-data/', import.meta.url).pathname;

/** No Bitcoin or CAS config: every sub-facade this script touches is offline. */
const api = createApi();

/** Every identifier in the corpus is on mutinynet (network_value 5, Table 1). */
const NETWORK = 'mutinynet';
const BTCR2_VERSION_NUMBER = 1;

/** Placeholder identifier of a Genesis Document. */
const PLACEHOLDER = 'did:btcr2:_';

/**
 * Secret key seeds. The key material is worthless by construction: anyone can
 * recompute these keys from the strings, which is the point for an example corpus.
 */
const SEEDS = {
  key0: 'did:btcr2 example corpus / controller / key-0',
  key1: 'did:btcr2 example corpus / controller / key-1',
  casAggregator: 'did:btcr2 example corpus / CAS aggregator',
  smtAggregator: 'did:btcr2 example corpus / SMT aggregator',
  keyBased: 'did:btcr2 example corpus / key-based identifier',
  cohortA: 'did:btcr2 example corpus / cohort member A',
  cohortB: 'did:btcr2 example corpus / cohort member B',
} as const;

/** SMT nonces, one per index per signal. */
const NONCE_SEEDS = {
  primary: 'did:btcr2 example corpus / SMT nonce / controller',
  cohortA: 'did:btcr2 example corpus / SMT nonce / cohort member A',
  cohortB: 'did:btcr2 example corpus / SMT nonce / cohort member B',
  cohortBSignalB: 'did:btcr2 example corpus / SMT nonce / cohort member B / signal B',
} as const;

/**
 * Bitcoin block metadata. The corpus is not anchored to a real chain, so these
 * illustrate the shape of resolution output rather than describing real blocks.
 */
const LAST_UPDATE_TIME = '2025-01-06T16:23:10Z';
const CONFIRMATIONS = 12;

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

type Json = any;

const seedKey = (seed: string) => api.crypto.keypair.fromSecret(sha256(utf8ToBytes(seed)));

/**
 * Fails unless two objects are the same JSON document. JCS sorts keys, so this
 * compares content and ignores key order, which is what separates a corpus that
 * disagrees with the implementation from one that only serializes differently.
 */
function agree(what: string, produced: Json, emitted: Json): void {
  if (canonicalize(produced) !== canonicalize(emitted)) {
    throw new Error(
      `${what}: the implementation and the corpus disagree\n`
      + `  implementation: ${canonicalize(produced)}\n`
      + `  corpus:         ${canonicalize(emitted)}`,
    );
  }
}

/** Fills a `{{variable}}` template and parses the result, as the operations do. */
function render(templateFile: string, vars: Record<string, string>): Json {
  const template = readFileSync(join(EXAMPLES, templateFile), 'utf8');
  const filled = template.replace(/\{\{\s*([\w-]+)\s*\}\}/g, (_, name: string) => {
    if (!(name in vars)) throw new Error(`${templateFile}: no value for {{${name}}}`);
    return vars[name];
  });
  return JSON.parse(filled);
}

/**
 * GAP 1. `LocalSigner` and `SchnorrMultikey` both draw random `aux_rand` for a
 * BIP340 signature, which a reproducible corpus cannot use. `Signer` is the
 * published seam for exactly this: the update path depends on the interface and
 * never on secret key bytes, so a signer that pins `aux_rand` to a label drops
 * into `Updater.sign` with nothing else changed.
 */
class PinnedSigner implements Signer {
  readonly publicKey: Uint8Array;
  readonly #secretKey: Uint8Array;
  readonly #auxRand: Uint8Array;

  constructor(keyPair: SchnorrKeyPair, label: string) {
    this.publicKey = keyPair.publicKey.compressed;
    this.#secretKey = keyPair.secretKey.bytes;
    this.#auxRand = sha256(utf8ToBytes(`did:btcr2 example corpus / aux_rand / ${label}`));
  }

  sign(data: Uint8Array, scheme: SigningScheme): Uint8Array {
    if (scheme !== 'bip340') {
      throw new Error(`PinnedSigner signs Data Integrity proofs only, not "${scheme}"`);
    }
    return schnorr.sign(data, this.#secretKey, this.#auxRand);
  }
}

// ---------------------------------------------------------------------------
// Keys and Beacon endpoints
// ---------------------------------------------------------------------------

const keys = Object.fromEntries(
  Object.entries(SEEDS).map(([name, seed]) => [name, seedKey(seed)]),
) as Record<keyof typeof SEEDS, SchnorrKeyPair>;

const network = getNetwork(NETWORK);

/**
 * GAP 4. `BeaconUtils.createBeaconServices` derives all three addresses of a
 * key-based identifier from the one key in the identifier, which is what the
 * key-based example needs and what it uses below. The external identifier gives
 * each aggregate Beacon a separate aggregator key, so those endpoints are derived
 * here and then handed back to `BeaconUtils.isBeaconService` to check.
 */
const endpoint = {
  p2pkh: (pk: Uint8Array) => `bitcoin:${p2pkh(pk, network).address}`,
  p2wpkh: (pk: Uint8Array) => `bitcoin:${p2wpkh(pk, network).address}`,
  p2tr: (x: Uint8Array) => `bitcoin:${p2tr(x, undefined, network).address}`,
};

// ---------------------------------------------------------------------------
// Genesis Document and the identifier derived from it
// ---------------------------------------------------------------------------

const genesisDocument = {
  '@context': ['https://www.w3.org/ns/did/v1.1', 'https://btcr2.dev/context/v1'],
  id: PLACEHOLDER,
  verificationMethod: [
    {
      id: `${PLACEHOLDER}#key-0`,
      type: 'Multikey',
      controller: PLACEHOLDER,
      publicKeyMultibase: keys.key0.publicKey.multibase.encoded,
    },
  ],
  assertionMethod: [`${PLACEHOLDER}#key-0`],
  capabilityInvocation: [`${PLACEHOLDER}#key-0`],
  service: [
    {
      id: `${PLACEHOLDER}#service-0`,
      type: 'SingletonBeacon',
      serviceEndpoint: endpoint.p2wpkh(keys.key0.publicKey.compressed),
    },
    {
      id: `${PLACEHOLDER}#service-1`,
      type: 'CASBeacon',
      serviceEndpoint: endpoint.p2tr(keys.casAggregator.publicKey.xOnly),
    },
    {
      id: `${PLACEHOLDER}#service-2`,
      type: 'SMTBeacon',
      serviceEndpoint: endpoint.p2tr(keys.smtAggregator.publicKey.xOnly),
    },
  ],
};

for (const service of genesisDocument.service) {
  if (!BeaconUtils.isBeaconService(service as BeaconService)) {
    throw new Error(`${service.id} is not a Beacon Service`);
  }
}

/** The implementation validates the Genesis Document and reduces it to genesis bytes. */
const genesis = GenesisDocument.fromJSON(structuredClone(genesisDocument));
const genesisBytes = GenesisDocument.toGenesisBytes(genesis);
agree('genesis bytes', { hash: canonicalHash(genesisDocument) }, { hash: hashToBase64Url(genesisBytes) });

/** An `x` HRP identifier commits to the Genesis Document hash. */
const did = api.did.encode(genesisBytes, {
  idType: IdentifierTypes.EXTERNAL,
  version: BTCR2_VERSION_NUMBER,
  network: NETWORK,
});

/** Resolution replaces the placeholder to establish version 1 of the document. */
const initialDocument: Json = JSON.parse(
  JSON.stringify(genesisDocument).replaceAll(PLACEHOLDER, did),
);
agree('version 1 document', genesis.toDidDocument(did), initialDocument);
DidDocument.isValid(initialDocument);

/** GAP 3 (property order). The specification lists `invocationTarget` before `controller`. */
const derivedCapability = Appendix.deriveRootCapability(did);
const rootCapability = {
  '@context': derivedCapability['@context'],
  id: derivedCapability.id,
  invocationTarget: derivedCapability.invocationTarget,
  controller: derivedCapability.controller,
};
agree('root capability', derivedCapability, rootCapability);

// ---------------------------------------------------------------------------
// Updates
// ---------------------------------------------------------------------------

interface Update {
  unsigned: Json;
  signed: Json;
  config: Json;
  hash: string;
  target: Json;
}

/**
 * Builds one update. `Updater.construct` applies the patch, validates the target
 * document, and computes both document hashes; `Updater.sign` checks the
 * verification method against the signing key and produces the Data Integrity
 * proof. The corpus files are rendered from the specification's own templates and
 * every field is compared against what the implementation produced.
 *
 * These two statics are what `@did-btcr2/api` calls. The api layer itself cannot
 * be used here: `DidMethodApi.update` and `UpdateBuilder.execute` broadcast a
 * Bitcoin transaction, and this corpus is not anchored to a chain. When an offline
 * update path lands, these are the only two lines that have to move.
 */
function buildUpdate(
  controller: string,
  source: Json,
  patch: PatchOperation[],
  sourceVersionId: number,
  keyPair: SchnorrKeyPair,
  verificationMethod: DidVerificationMethod,
  label: string,
): Update {
  const constructed = Updater.construct(source, patch, sourceVersionId);
  const target = JSONPatch.apply(source, patch);

  /**
   * GAP 2. The template carries the pinned `@context`; the published
   * `@did-btcr2/method` still carries the earlier array. Nothing else may differ.
   */
  const unsigned = render('btcr2-unsigned-update-template.hbs', {
    'array-of-patches': JSON.stringify(constructed.patch),
    'source-hash': constructed.sourceHash,
    'target-hash': constructed.targetHash,
    'target-version-id': String(constructed.targetVersionId),
  });
  agree(`update ${label}`, { ...constructed, '@context': unsigned['@context'] }, unsigned);
  agree(`target document ${label}`, { hash: canonicalHash(target) }, { hash: unsigned.targetHash });

  const signer = new PinnedSigner(keyPair, label);
  const produced = Updater.sign(controller, structuredClone(unsigned), verificationMethod, signer);
  const { proofValue, ...producedConfig } = produced.proof;

  /** GAP 3 (property order). The same proof configuration, in the order the specification documents. */
  const config = render('data-integrity-config.hbs', {
    'verification-method': verificationMethod.id,
    capability: `urn:zcap:root:${encodeURIComponent(controller)}`,
  });
  agree(`proof config ${label}`, producedConfig, config);

  const signed = { ...unsigned, proof: { ...config, proofValue } };

  // Verify the object that is written, not the object that was signed, so that a
  // reordering mistake in the step above cannot produce a corpus that fails to verify.
  const suite = api.crypto.cryptosuite.create(api.crypto.multikey.fromVerificationMethod(verificationMethod));
  if (!api.crypto.cryptosuite.verifyProof(structuredClone(signed), suite).verified) {
    throw new Error(`proof for ${label} failed verification`);
  }

  return { unsigned, signed, config, hash: canonicalHash(signed), target };
}

const key0Method: DidVerificationMethod = {
  id: `${did}#key-0`,
  type: 'Multikey',
  controller: did,
  publicKeyMultibase: keys.key0.publicKey.multibase.encoded,
};
const key1Reference = `${did}#key-1`;

/** Update 2: add a second key. Announced by the Singleton Beacon. */
const update2 = buildUpdate(
  did,
  initialDocument,
  [
    {
      op: 'add',
      path: '/verificationMethod/1',
      value: {
        id: key1Reference,
        type: 'Multikey',
        controller: did,
        publicKeyMultibase: keys.key1.publicKey.multibase.encoded,
      },
    },
    { op: 'add', path: '/authentication', value: [key1Reference] },
  ],
  1,
  keys.key0,
  key0Method,
  'update-2',
);

/** Update 3: add a fourth Beacon. Announced by the CAS Beacon. */
const update3 = buildUpdate(
  did,
  update2.target,
  [
    {
      op: 'add',
      path: '/service/3',
      value: {
        id: `${did}#service-3`,
        type: 'SingletonBeacon',
        serviceEndpoint: endpoint.p2wpkh(keys.key1.publicKey.compressed),
      },
    },
  ],
  2,
  keys.key0,
  key0Method,
  'update-3',
);

/** Update 4: rotate the update authorization to the second key. Announced by the SMT Beacon. */
const update4 = buildUpdate(
  did,
  update3.target,
  [{ op: 'replace', path: '/capabilityInvocation', value: [key1Reference] }],
  3,
  keys.key0,
  key0Method,
  'update-4',
);

// ---------------------------------------------------------------------------
// Two more identifiers, so the aggregate examples carry real hashes
// ---------------------------------------------------------------------------

/** A key-based identifier and the document that is deterministically generated from it. */
function keyBased(keyPair: SchnorrKeyPair) {
  const id = api.did.encode(keyPair.publicKey.compressed, {
    idType: IdentifierTypes.KEY,
    version: BTCR2_VERSION_NUMBER,
    network: NETWORK,
  });

  // The implementation derives the three default Beacon Services of a `k` identifier.
  const services = BeaconUtils.createBeaconServices(id, 'SingletonBeacon');
  const document = render('key-based-initial-did-document-template.hbs', {
    did: id,
    'public-key-multikey': keyPair.publicKey.multibase.encoded,
    'p2pkh-bitcoin-address': services[0].serviceEndpoint as string,
    'p2wpkh-bitcoin-address': services[1].serviceEndpoint as string,
    'p2tr-bitcoin-address': services[2].serviceEndpoint as string,
  });
  agree(`Beacon Services of ${id}`, services, document.service);
  DidDocument.isValid(document);

  return { did: id, document };
}

const keyBasedIdentifier = keyBased(keys.keyBased);
const cohortA = keyBased(keys.cohortA);
const cohortB = keyBased(keys.cohortB);

/** One update each, so their announcement entries are real update hashes. */
const cohortUpdate = (member: { did: string; document: Json }, keyPair: SchnorrKeyPair, label: string) =>
  buildUpdate(
    member.did,
    member.document,
    [{ op: 'remove', path: '/capabilityDelegation' }],
    1,
    keyPair,
    {
      id: `${member.did}#initialKey`,
      type: 'Multikey',
      controller: member.did,
      publicKeyMultibase: keyPair.publicKey.multibase.encoded,
    },
    label,
  );

const cohortAUpdate = cohortUpdate(cohortA, keys.cohortA, 'cohort-a');
const cohortBUpdate = cohortUpdate(cohortB, keys.cohortB, 'cohort-b');

/**
 * A CAS Announcement maps each DID in the cohort to its update hash. `CASBeacon`
 * assembles this during a broadcast, which needs a funded Beacon address, so the
 * mapping is assembled here from the same `canonicalHash` the Beacon uses.
 */
const casAnnouncement = {
  [did]: update3.hash,
  [cohortA.did]: cohortAUpdate.hash,
  [cohortB.did]: cohortBUpdate.hash,
};

// ---------------------------------------------------------------------------
// Sparse Merkle Tree
// ---------------------------------------------------------------------------

const nonces = Object.fromEntries(
  Object.entries(NONCE_SEEDS).map(([name, seed]) => [name, sha256(utf8ToBytes(seed))]),
) as Record<keyof typeof NONCE_SEEDS, Uint8Array>;

/**
 * GAP 5 (SMT). SMT Proof Verification is the authority. `@did-btcr2/smt@0.3.0`
 * has two leaf arms, a required `nonce`, and `bitAt` counted from the least
 * significant bit, so this script builds the tree itself. `bitAt(i)` is bit `i`
 * counted from left to right over the 32 bytes: `bitAt(0)` is the most
 * significant bit of the first byte, and the walk starts at the leaf with
 * `bitAt(255)`. The package supplies the hashed-zero cache and the helpers.
 */
type Leaf = { index: bigint; value: Uint8Array };
type SmtProofDocument = { id: string; nonce?: string; updateId?: string; collapsed: string; hashes: string[] };
type Submission = { did: string; nonce?: Uint8Array; updateId?: Uint8Array };

const bitAt = (value: bigint, i: number): number => Number((value >> BigInt(255 - i)) & 1n);

/** The four leaf arms of SMT Proof Verification. */
function leafValue(nonce?: Uint8Array, updateId?: Uint8Array): Uint8Array {
  if (nonce && updateId) return blockHash(blockHash(nonce), updateId);
  if (nonce) return blockHash(blockHash(nonce));
  if (updateId) return updateId;
  return CACHED_ZERO[0]!;
}

/** Root of the subtree that spans `height` levels; the whole tree is 256. */
function subtreeHash(leaves: Leaf[], height: number): Uint8Array {
  if (leaves.length === 0) return CACHED_ZERO[height]!;
  if (height === 0) return leaves[0]!.value;
  const i = 256 - height;
  const left = leaves.filter((leaf) => bitAt(leaf.index, i) === 0);
  const right = leaves.filter((leaf) => bitAt(leaf.index, i) === 1);
  return blockHash(subtreeHash(left, height - 1), subtreeHash(right, height - 1));
}

/** Proof for `target`, a member or not: the sibling at each level from the leaf up. */
function generateProof(leaves: Leaf[], target: bigint): { collapsed: bigint; hashes: Uint8Array[] } {
  let collapsed = 0n;
  const hashes: Uint8Array[] = [];
  for (let height = 1; height <= 256; height++) {
    const i = 256 - height;
    const siblings = leaves.filter((leaf) => {
      for (let above = 0; above < i; above++) {
        if (bitAt(leaf.index, above) !== bitAt(target, above)) return false;
      }
      return bitAt(leaf.index, i) !== bitAt(target, i);
    });
    if (siblings.length === 0) collapsed |= 1n << BigInt(255 - i);
    else hashes.push(subtreeHash(siblings, height - 1));
  }
  return { collapsed, hashes };
}

/** SMT Proof Verification, per the pseudocode in the specification. */
function verifyProof(proof: SmtProofDocument, did: string): boolean {
  const nonce = proof.nonce === undefined ? undefined : base64UrlToHash(proof.nonce);
  const updateId = proof.updateId === undefined ? undefined : base64UrlToHash(proof.updateId);
  const collapsed = hashToBigInt(base64UrlToHash(proof.collapsed));
  const hashes = proof.hashes.map(base64UrlToHash);
  let ones = 0;
  for (let i = 0; i < 256; i++) ones += bitAt(collapsed, i);
  if (hashes.length + ones !== 256) return false;
  let candidate = leafValue(nonce, updateId);
  const index = didToIndex(did);
  let next = 0;
  for (let n = 0; n <= 255; n++) {
    const i = 255 - n;
    const sibling = bitAt(collapsed, i) === 1 ? CACHED_ZERO[n]! : hashes[next++]!;
    candidate = bitAt(index, i) === 1 ? blockHash(sibling, candidate) : blockHash(candidate, sibling);
  }
  return hashToBase64Url(candidate) === proof.id;
}

/** Builds the tree for one signal and serializes the proof of `did` in the spec property order. */
function smtProof(signal: Submission[], did: string): SmtProofDocument {
  const leaves = signal
    .filter((s) => s.nonce || s.updateId)
    .map((s) => ({ index: didToIndex(s.did), value: leafValue(s.nonce, s.updateId) }));
  const root = subtreeHash(leaves, 256);
  const { collapsed, hashes } = generateProof(leaves, didToIndex(did));
  const own = signal.find((s) => s.did === did);
  const proof: SmtProofDocument = { id: hashToBase64Url(root) };
  if (own?.nonce) proof.nonce = hashToBase64Url(own.nonce);
  if (own?.updateId) proof.updateId = hashToBase64Url(own.updateId);
  proof.collapsed = hashToBase64Url(bigIntToHash(collapsed));
  proof.hashes = hashes.map(hashToBase64Url);
  if (!verifyProof(proof, did)) throw new Error(`generated SMT proof for ${did} failed verification`);
  return proof;
}

/** Signal A: update 4 for the primary identifier in nonce mode, nonce non-updates for the rest. */
const signalA: Submission[] = [
  { did, nonce: nonces.primary, updateId: base64UrlToHash(update4.hash) },
  { did: cohortA.did, nonce: nonces.cohortA },
  { did: cohortB.did, nonce: nonces.cohortB },
];

/**
 * Signal B, in a later block: the primary identifier submits nothing in no-nonce
 * mode, so its index is empty and its proof carries neither `nonce` nor `updateId`.
 * Cohort member A announces an update in no-nonce mode, and cohort member B keeps a
 * nonce non-update. Together the two signals exercise all four leaf arms.
 */
const signalB: Submission[] = [
  { did: cohortA.did, updateId: base64UrlToHash(cohortAUpdate.hash) },
  { did: cohortB.did, nonce: nonces.cohortBSignalB },
];

const smtProofA = smtProof(signalA, did);
const smtProofB = smtProof(signalB, did);

if (smtProofA.updateId !== update4.hash) {
  throw new Error('the SMT leaf does not commit to the hash of update 4');
}
if (smtProofB.nonce !== undefined || smtProofB.updateId !== undefined) {
  throw new Error('the empty-index proof must carry neither nonce nor updateId');
}

// ---------------------------------------------------------------------------
// Sidecar and resolution
// ---------------------------------------------------------------------------

const sidecarData = {
  '@context': 'https://btcr2.dev/context/v1',
  genesisDocument,
  updates: [update2.signed, update3.signed, update4.signed],
  casUpdates: [casAnnouncement],
  smtProofs: [smtProofA, smtProofB],
};

const resolutionOptions = {
  versionId: '4',
  minConf: 6,
  sidecar: sidecarData,
};

const didDocumentMetadata = {
  confirmations: CONFIRMATIONS,
  deactivated: false,
  updated: LAST_UPDATE_TIME,
  versionId: '4',
};

const didResolutionMetadata = { contentType: 'application/did' };

// ---------------------------------------------------------------------------
// Emit
// ---------------------------------------------------------------------------

const corpus: Record<string, Json> = {
  'genesis-document.json': genesisDocument,
  'initial-did-document.json': keyBasedIdentifier.document,
  'btcr2-unsigned-update.json': update2.unsigned,
  'btcr2-signed-update.json': update2.signed,
  'data-integrity-config.json': update2.config,
  'data-integrity-proof.json': update2.signed.proof,
  'cas-announcement.json': casAnnouncement,
  'root-capability.json': rootCapability,
  'sidecar-data.json': sidecarData,
  'sidecar-smt-proof.json': smtProofA,
  'sidecar-smt-proof-empty.json': smtProofB,
  'resolution-options.json': resolutionOptions,
  'did-document-metadata.json': didDocumentMetadata,
  'did-resolution-metadata.json': didResolutionMetadata,
};

/** Recomputes every hash in the corpus from the documents it ships alongside. */
function selfCheck(): void {
  const context = render('btcr2-unsigned-update-template.hbs', {
    'array-of-patches': '[]',
    'source-hash': '',
    'target-hash': '',
    'target-version-id': '0',
  })['@context'];

  const chain = [
    { update: update2, source: initialDocument },
    { update: update3, source: update2.target },
    { update: update4, source: update3.target },
  ];
  for (const { update, source } of chain) {
    if (update.signed.sourceHash !== canonicalHash(source)) {
      throw new Error(`sourceHash mismatch on update ${update.signed.targetVersionId}`);
    }
    if (update.signed.targetHash !== canonicalHash(update.target)) {
      throw new Error(`targetHash mismatch on update ${update.signed.targetVersionId}`);
    }
    if (JSON.stringify(update.signed['@context']) !== JSON.stringify(context)) {
      throw new Error(`@context mismatch on update ${update.signed.targetVersionId}`);
    }
    if (JSON.stringify(update.signed.proof['@context']) !== JSON.stringify(context)) {
      throw new Error(`proof @context mismatch on update ${update.signed.targetVersionId}`);
    }
  }
  if (api.did.decode(did).idType !== IdentifierTypes.EXTERNAL) {
    throw new Error('the primary identifier is not an external identifier');
  }
  if (hashToBase64Url(api.did.decode(did).genesisBytes) !== canonicalHash(genesisDocument)) {
    throw new Error('identifier does not commit to the Genesis Document');
  }
  if (casAnnouncement[did] !== update3.hash) {
    throw new Error('CAS Announcement does not carry the update hash');
  }
}

selfCheck();

const check = process.argv.includes('--check');
let failures = 0;

for (const [name, document] of Object.entries(corpus)) {
  const path = join(EXAMPLES, name);
  const serialized = `${JSON.stringify(document, null, 2)}\n`;
  if (check) {
    const current = existsSync(path) ? readFileSync(path, 'utf8') : '';
    if (current !== serialized) {
      console.error(`differs: ${name}`);
      failures++;
    }
  } else {
    writeFileSync(path, serialized);
  }
}

if (check) {
  console.log(failures === 0 ? `${Object.keys(corpus).length} files match` : `${failures} file(s) differ`);
  process.exit(failures === 0 ? 0 : 1);
}

console.log(`wrote ${Object.keys(corpus).length} files to src/example-data`);
console.log(`  identifier: ${did}`);
console.log(`  key-based:  ${keyBasedIdentifier.did}`);
