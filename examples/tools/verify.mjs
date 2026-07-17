#!/usr/bin/env node
// Reference verifier for Attested AI-Assisted Work receipts.
//
// Implements the verification flow from SPEC.md: given a receipt and a
// published key set, return exactly one of the four defined results.
//
//   unknown_key  key_id is absent from the published key set
//   tampered     signature does not verify over the canonical signing input
//   revoked      key is published but its status is "revoked"
//   valid        key is active and the signature verifies
//
// Precedence is deliberate: a key must be known before a signature can be
// checked, and a signature must be intact before revocation is meaningful. A
// receipt whose signing key was later revoked still returns `revoked`, not
// `valid`, even though its signature is cryptographically sound.
//
// Usage:
//   node verify.mjs <receipt.json> [key-set.json]
// Defaults the key set to ../keys.json relative to this file.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createPublicKey, verify as edVerify } from "node:crypto";
import { canonicalSigningInput } from "./canonicalize.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));

// Ed25519 raw-public-key -> SPKI DER prefix (RFC 8410).
const ED25519_SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

function b64urlToBuffer(s) {
  return Buffer.from(s, "base64url");
}

function rawEd25519PublicKey(b64url) {
  const raw = b64urlToBuffer(b64url);
  const der = Buffer.concat([ED25519_SPKI_PREFIX, raw]);
  return createPublicKey({ key: der, format: "der", type: "spki" });
}

/**
 * Verify a receipt against a key set.
 * @param {object} receipt
 * @param {object} keySet - { keys: [{ key_id, public_key, status, ... }] }
 * @returns {{ result: string, key_id: string, issued_at: string }}
 */
export function verifyReceipt(receipt, keySet) {
  const out = { key_id: receipt.key_id, issued_at: receipt.issued_at };
  const key = (keySet.keys || []).find((k) => k.key_id === receipt.key_id);

  if (!key) return { result: "unknown_key", ...out };

  let signatureOk = false;
  try {
    const pub = rawEd25519PublicKey(key.public_key);
    signatureOk = edVerify(
      null,
      canonicalSigningInput(receipt),
      pub,
      b64urlToBuffer(receipt.signature),
    );
  } catch {
    signatureOk = false;
  }

  if (!signatureOk) return { result: "tampered", ...out };
  if (key.status === "revoked") return { result: "revoked", ...out };
  return { result: "valid", ...out };
}

// CLI entry point.
if (import.meta.url === `file://${process.argv[1]}`) {
  const receiptPath = process.argv[2];
  if (!receiptPath) {
    console.error("usage: node verify.mjs <receipt.json> [key-set.json]");
    process.exit(2);
  }
  const keySetPath = process.argv[3] || resolve(HERE, "..", "keys.json");
  const receipt = JSON.parse(readFileSync(receiptPath, "utf8"));
  const keySet = JSON.parse(readFileSync(keySetPath, "utf8"));
  const res = verifyReceipt(receipt, keySet);
  console.log(JSON.stringify(res, null, 2));
  process.exit(res.result === "valid" ? 0 : 1);
}
