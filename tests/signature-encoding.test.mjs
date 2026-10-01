// Regression: a receipt's signature must be a canonical encoding of 64 bytes.
// Node's base64 decoders skip non-alphabet characters and trailing data, so a
// valid signature with whitespace, extra padding or junk appended used to still
// verify as `valid`.
//
//   node --test tests/signature-encoding.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { verifyReceipt } from "../examples/tools/verify.mjs";

const EXAMPLES = resolve(dirname(fileURLToPath(import.meta.url)), "..", "examples");
const readJson = (...p) => JSON.parse(readFileSync(join(EXAMPLES, ...p), "utf8"));
const keySet = readJson("keys.json");
const receipt = readJson("receipts", "valid.json");
const sig = receipt.signature;

test("canonical base64url and padded base64 encodings of the signature both verify", () => {
  assert.equal(verifyReceipt(receipt, keySet).result, "valid");
  const padded = Buffer.from(sig, "base64url").toString("base64");
  assert.equal(verifyReceipt({ ...receipt, signature: padded }, keySet).result, "valid");
});

for (const [label, mangled] of [
  ["trailing junk", sig + "!!!"],
  ["surrounding whitespace", ` ${sig}\n`],
  ["padding on base64url", sig + "=="],
  ["embedded junk", sig.slice(0, 10) + "*" + sig.slice(10)],
  ["standard base64 without padding", Buffer.from(sig, "base64url").toString("base64").replace(/=+$/, "")],
  ["non-string", 42],
]) {
  test(`a non-canonical signature (${label}) is tampered`, () => {
    assert.equal(verifyReceipt({ ...receipt, signature: mangled }, keySet).result, "tampered");
  });
}
