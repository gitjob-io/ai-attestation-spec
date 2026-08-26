#!/usr/bin/env node
// Conformance runner: drives the reference verifier over tests/vectors.json.
//
// Every verifier claiming conformance — the Go reference, a future
// `@gitjob/attest`, or a third-party implementation — must produce the
// `expected` result for every case here.
//
//   node tests/run-vectors.mjs
//
// Exits non-zero on the first mismatch, so it works as a CI gate.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { verifyReceipt } from "../examples/tools/verify.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const vectors = JSON.parse(readFileSync(resolve(HERE, "vectors.json"), "utf8"));

const keySet = { keys: vectors.keyset };
let failed = 0;

for (const [i, testCase] of vectors.cases.entries()) {
  const label = `case ${i + 1} (${testCase.expected})`;
  let actual;
  try {
    actual = verifyReceipt(testCase.receipt, keySet).result;
  } catch (error) {
    console.error(`✗ ${label}: threw — ${error.message}`);
    failed += 1;
    continue;
  }
  if (actual === testCase.expected) {
    console.log(`✓ ${label}`);
  } else {
    console.error(`✗ ${label}: got "${actual}"`);
    failed += 1;
  }
}

console.log(`\n${vectors.cases.length - failed}/${vectors.cases.length} vectors passed`);
process.exit(failed === 0 ? 0 : 1);
