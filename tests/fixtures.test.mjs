// Fixture integrity: the published examples must agree with the published
// schemas, with the reference verifier, and with the generator that claims to
// reproduce them byte-for-byte. Each of those claims is made in prose in
// README.md / examples/README.md; this file is what holds them.
//
//   node --test            (from the repository root)

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { verifyReceipt } from "../examples/tools/verify.mjs";

const EXAMPLES = resolve(dirname(fileURLToPath(import.meta.url)), "..", "examples");
const readJson = (...p) => JSON.parse(readFileSync(join(EXAMPLES, ...p), "utf8"));

const schemas = {
  receipt: readJson("schema", "receipt.schema.json"),
  keySet: readJson("schema", "key-set.schema.json"),
  verifyResult: readJson("schema", "verify-result.schema.json"),
};
const keySet = readJson("keys.json");
const RECEIPTS = ["valid", "tampered", "unknown_key", "revoked"];

// Minimal JSON Schema 2020-12 validator covering exactly the keywords the
// schemas in examples/schema/ use. Any other assertion keyword throws, so a
// schema edit that outgrows this validator fails loudly instead of passing
// unchecked. `format` is annotation-only in 2020-12 and is not asserted.
const ANNOTATIONS = new Set(["$schema", "$id", "$defs", "title", "description", "format"]);
const ASSERTIONS = new Set([
  "type", "required", "properties", "additionalProperties", "items",
  "minItems", "minLength", "pattern", "const", "enum", "$ref",
]);

function validate(schema, value, root = schema, path = "$") {
  const errors = [];
  for (const kw of Object.keys(schema)) {
    if (!ANNOTATIONS.has(kw) && !ASSERTIONS.has(kw)) {
      throw new Error(`validator does not support keyword "${kw}" at ${path}`);
    }
  }
  if (schema.$ref) {
    const m = /^#\/\$defs\/(.+)$/.exec(schema.$ref);
    if (!m || !root.$defs?.[m[1]]) throw new Error(`unresolvable $ref ${schema.$ref}`);
    errors.push(...validate(root.$defs[m[1]], value, root, path));
  }
  const kind = Array.isArray(value) ? "array" : value === null ? "null" : typeof value;
  if (schema.type && schema.type !== kind) return [...errors, `${path}: expected ${schema.type}, got ${kind}`];
  if ("const" in schema && value !== schema.const) errors.push(`${path}: must equal ${JSON.stringify(schema.const)}`);
  if (schema.enum && !schema.enum.includes(value)) errors.push(`${path}: not in enum`);
  if (kind === "string") {
    if (schema.minLength !== undefined && value.length < schema.minLength) errors.push(`${path}: shorter than ${schema.minLength}`);
    if (schema.pattern && !new RegExp(schema.pattern, "u").test(value)) errors.push(`${path}: does not match ${schema.pattern}`);
  }
  if (kind === "array") {
    if (schema.minItems !== undefined && value.length < schema.minItems) errors.push(`${path}: fewer than ${schema.minItems} items`);
    if (schema.items) value.forEach((v, i) => errors.push(...validate(schema.items, v, root, `${path}[${i}]`)));
  }
  if (kind === "object") {
    for (const r of schema.required ?? []) if (!(r in value)) errors.push(`${path}: missing required "${r}"`);
    for (const [k, v] of Object.entries(value)) {
      const sub = schema.properties?.[k];
      if (sub) errors.push(...validate(sub, v, root, `${path}.${k}`));
      else if (schema.additionalProperties === false) errors.push(`${path}: unexpected property "${k}"`);
    }
  }
  return errors;
}

test("keys.json conforms to key-set.schema.json", () => {
  assert.deepEqual(validate(schemas.keySet, keySet), []);
});

for (const name of RECEIPTS) {
  test(`receipts/${name}.json conforms to receipt.schema.json and verifies as "${name}"`, () => {
    const receipt = readJson("receipts", `${name}.json`);
    assert.deepEqual(validate(schemas.receipt, receipt), []);

    const result = verifyReceipt(receipt, keySet);
    assert.equal(result.result, name);
    assert.deepEqual(validate(schemas.verifyResult, result), []);
  });
}

test("the schema check is not vacuous: an extra or malformed field is rejected", () => {
  const receipt = readJson("receipts", "valid.json");
  assert.ok(validate(schemas.receipt, { ...receipt, extra: "x" }).some((e) => e.includes('"extra"')));
  assert.ok(validate(schemas.receipt, { ...receipt, prompt_hash: "sha256:ABC" }).some((e) => e.includes("prompt_hash")));
  const { signature, ...unsigned } = receipt;
  assert.ok(validate(schemas.receipt, unsigned).some((e) => e.includes('"signature"')));
});

test("generate.mjs reproduces every committed fixture byte-for-byte", () => {
  const tmp = mkdtempSync(join(tmpdir(), "attest-gen-"));
  try {
    const copy = join(tmp, "examples");
    cpSync(EXAMPLES, copy, { recursive: true });
    const run = spawnSync(process.execPath, [join(copy, "tools", "generate.mjs")], { encoding: "utf8" });
    assert.equal(run.status, 0, run.stderr);

    const files = ["keys.json", ...readdirSync(join(EXAMPLES, "receipts")).map((f) => join("receipts", f))];
    assert.ok(files.length >= 5);
    for (const f of files) {
      assert.equal(readFileSync(join(copy, f), "utf8"), readFileSync(join(EXAMPLES, f), "utf8"), `${f} drifted from generate.mjs`);
    }
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});
