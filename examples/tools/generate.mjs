#!/usr/bin/env node
// Deterministically (re)generate the reference key set and example receipts.
//
// Uses only Node's built-in crypto — no dependencies. Ed25519 signing keys are
// derived from FIXED, NON-SECRET test seeds embedded below, so every run
// reproduces byte-identical fixtures. These seeds exist only to make the
// examples verifiable; they protect nothing and MUST NOT be used in production.
//
// Run from anywhere:  node examples/tools/generate.mjs
// Writes:  examples/keys.json, examples/receipts/{valid,tampered,unknown_key,revoked}.json

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import {
  createHash,
  createPrivateKey,
  createPublicKey,
  sign as edSign,
} from "node:crypto";
import { canonicalSigningInput } from "./canonicalize.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const EXAMPLES = resolve(HERE, "..");

// PKCS8 DER prefix for an Ed25519 private key, followed by the 32-byte seed.
const ED25519_PKCS8_PREFIX = Buffer.from(
  "302e020100300506032b657004220420",
  "hex",
);

// NON-SECRET TEST SEEDS — deterministic, throwaway. Do not reuse anywhere real.
const ACTIVE_SEED = Buffer.alloc(32, 0x11); // published, active key
const RETIRED_SEED = Buffer.alloc(32, 0x22); // published, revoked key
const FOREIGN_SEED = Buffer.alloc(32, 0x33); // never published -> unknown_key

function keyPairFromSeed(seed) {
  const pkcs8 = Buffer.concat([ED25519_PKCS8_PREFIX, seed]);
  const privateKey = createPrivateKey({
    key: pkcs8,
    format: "der",
    type: "pkcs8",
  });
  const publicKey = createPublicKey(privateKey);
  const rawPub = publicKey
    .export({ format: "der", type: "spki" })
    .subarray(-32); // strip the 12-byte SPKI prefix
  return { privateKey, publicKeyB64Url: rawPub.toString("base64url") };
}

const active = keyPairFromSeed(ACTIVE_SEED);
const retired = keyPairFromSeed(RETIRED_SEED);
const foreign = keyPairFromSeed(FOREIGN_SEED);

const KEY_IDS = {
  active: "gitjob-attest-2026-05",
  retired: "gitjob-attest-2025-11",
  foreign: "gitjob-attest-9999-99", // absent from the published key set
};

function sha256Field(text) {
  return "sha256:" + createHash("sha256").update(text, "utf8").digest("hex");
}

// A single illustrative completion, shared across the fixtures. Prompt and
// output are hashed, never stored — only the hashes appear in a receipt.
const PROMPT = "Summarize the attached quarterly report in three bullet points.";
const OUTPUT =
  "- Revenue grew 12% QoQ.\n- Operating margin held at 23%.\n- Headcount flat.";

function baseReceipt(overrides = {}) {
  return {
    receipt_id: "6f9619ff-8b86-d011-b42d-00cf4fc964ff",
    model_id: "anthropic/claude-opus-4-8",
    prompt_hash: sha256Field(PROMPT),
    output_hash: sha256Field(OUTPUT),
    issued_at: "2026-05-03T18:24:11Z",
    key_id: KEY_IDS.active,
    ...overrides,
  };
}

function signReceipt(receipt, privateKey) {
  const sig = edSign(null, canonicalSigningInput(receipt), privateKey);
  return { ...receipt, signature: sig.toString("base64url") };
}

// --- Key set (the /v1/receipts/keys response) --------------------------------
const keySet = {
  keys: [
    {
      key_id: KEY_IDS.active,
      algorithm: "ed25519",
      public_key: active.publicKeyB64Url,
      status: "active",
      not_before: "2026-05-01T00:00:00Z",
    },
    {
      key_id: KEY_IDS.retired,
      algorithm: "ed25519",
      public_key: retired.publicKeyB64Url,
      status: "revoked",
      not_before: "2025-11-01T00:00:00Z",
      revoked_at: "2026-05-01T00:00:00Z",
    },
  ],
};

// --- valid: active key, intact signature -------------------------------------
const valid = signReceipt(baseReceipt(), active.privateKey);

// --- tampered: valid receipt with output_hash altered AFTER signing ----------
// The output was changed post-issuance, so the signature no longer covers it.
const tampered = {
  ...valid,
  output_hash: sha256Field(OUTPUT + " (edited)"),
};

// --- unknown_key: signed with a key that is not in the published set ---------
const unknownKey = signReceipt(
  baseReceipt({
    receipt_id: "3a1c2b40-5e77-4c9a-9f01-2d6b8e4415aa",
    key_id: KEY_IDS.foreign,
  }),
  foreign.privateKey,
);

// --- revoked: intact signature from a key that has since been revoked --------
const revoked = signReceipt(
  baseReceipt({
    receipt_id: "b23d5f18-0c44-49d2-8a1e-77c9e0e2b6d1",
    issued_at: "2026-01-15T09:03:52Z",
    key_id: KEY_IDS.retired,
  }),
  retired.privateKey,
);

function writeJson(relPath, obj) {
  const full = resolve(EXAMPLES, relPath);
  writeFileSync(full, JSON.stringify(obj, null, 2) + "\n");
  console.log("wrote", relPath);
}

writeJson("keys.json", keySet);
writeJson("receipts/valid.json", valid);
writeJson("receipts/tampered.json", tampered);
writeJson("receipts/unknown_key.json", unknownKey);
writeJson("receipts/revoked.json", revoked);
