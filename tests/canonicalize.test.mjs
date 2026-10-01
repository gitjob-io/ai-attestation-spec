// Regression: the signing input must cover every field but `signature`, in
// RFC 8785 form. A JSON-parsed "__proto__" key used to be dropped from the
// signed bytes (so it could be injected into a valid receipt), and nested
// objects were serialized in insertion order rather than canonical order.
//
//   node --test tests/canonicalize.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { canonicalJson, canonicalSigningInput } from "../examples/tools/canonicalize.mjs";
import { verifyReceipt } from "../examples/tools/verify.mjs";

const EXAMPLES = resolve(dirname(fileURLToPath(import.meta.url)), "..", "examples");
const readJson = (...p) => JSON.parse(readFileSync(join(EXAMPLES, ...p), "utf8"));

test('a "__proto__" field added after signing is covered and breaks the signature', () => {
  const receipt = readJson("receipts", "valid.json");
  const injected = JSON.parse(JSON.stringify(receipt).replace("{", '{"__proto__":{"model_id":"x/y"},'));
  assert.ok(Object.hasOwn(injected, "__proto__"));
  assert.match(canonicalSigningInput(injected).toString("utf8"), /"__proto__":\{"model_id":"x\/y"\}/);
  assert.equal(verifyReceipt(injected, readJson("keys.json")).result, "tampered");
});

test("nested values are canonicalized per RFC 8785", () => {
  const value = JSON.parse('{"b":{"z":[1E2,true,null,"\\u00e9"],"a":-0},"a":"x","\\u20ac":1.5e-7}');
  assert.equal(canonicalJson(value), '{"a":"x","b":{"a":0,"z":[100,true,null,"é"]},"€":1.5e-7}');
});

test("string-only receipts canonicalize to sorted-key JSON without signature", () => {
  const receipt = readJson("receipts", "valid.json");
  const { signature, ...rest } = receipt;
  const sorted = Object.fromEntries(Object.keys(rest).sort().map((k) => [k, rest[k]]));
  assert.equal(canonicalSigningInput(receipt).toString("utf8"), JSON.stringify(sorted));
});
