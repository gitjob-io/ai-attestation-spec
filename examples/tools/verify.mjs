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
//
// Exit status: 0 when the result is `valid`, 1 for any other result, 2 when
// no result could be produced (usage error, unreadable file, invalid JSON, or
// a receipt / key set that is not a JSON object).

import { readFileSync, realpathSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";
import { createPublicKey, verify as edVerify } from "node:crypto";
import { canonicalSigningInput } from "./canonicalize.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));

// Ed25519 raw-public-key -> SPKI DER prefix (RFC 8410).
const ED25519_SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

function b64urlToBuffer(s) {
  return Buffer.from(s, "base64url");
}

// Decode a receipt signature strictly. Node's base64 decoders skip characters
// outside the alphabet and ignore trailing data, so without this check
// whitespace, padding or junk could be added to a valid receipt's signature and
// it would still verify -- many byte-distinct receipts for one signing. Accept
// only the canonical encodings of 64 raw bytes: base64url without padding (as
// examples/schema/receipt.schema.json pins) or standard padded base64 (as the
// conformance vectors in tests/vectors.json carry). Anything else -> null.
function decodeSignature(s) {
  if (typeof s !== "string") return null;
  const buf = Buffer.from(s, "base64url");
  if (buf.length !== 64) return null;
  const canonical = buf.toString("base64url") === s || buf.toString("base64") === s;
  return canonical ? buf : null;
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
    const sig = decodeSignature(receipt.signature);
    signatureOk =
      sig !== null && edVerify(null, canonicalSigningInput(receipt), pub, sig);
  } catch {
    signatureOk = false;
  }

  if (!signatureOk) return { result: "tampered", ...out };
  if (key.status === "revoked") return { result: "revoked", ...out };
  return { result: "valid", ...out };
}

// CLI entry point. Compare URLs, not a hand-built `file://` string: paths with
// spaces or other URL-escaped characters (and symlinked paths such as macOS
// /tmp) would otherwise never match, and the script would silently exit 0 --
// which a caller reads as "valid".
const invokedDirectly =
  process.argv[1] &&
  import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href;

if (invokedDirectly) {
  const receiptPath = process.argv[2];
  if (!receiptPath) {
    console.error("usage: node verify.mjs <receipt.json> [key-set.json]");
    process.exit(2);
  }
  const keySetPath = process.argv[3] || resolve(HERE, "..", "keys.json");
  // An input error must not share exit status 1 with a `tampered` result.
  const readObject = (path, what) => {
    let value;
    try {
      value = JSON.parse(readFileSync(path, "utf8"));
    } catch (error) {
      console.error(`verify.mjs: cannot read ${what} ${path}: ${error.message}`);
      process.exit(2);
    }
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      console.error(`verify.mjs: ${what} ${path} is not a JSON object`);
      process.exit(2);
    }
    return value;
  };
  const receipt = readObject(receiptPath, "receipt");
  const keySet = readObject(keySetPath, "key set");
  const res = verifyReceipt(receipt, keySet);
  console.log(JSON.stringify(res, null, 2));
  process.exit(res.result === "valid" ? 0 : 1);
}
