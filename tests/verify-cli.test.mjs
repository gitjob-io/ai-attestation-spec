// Regression: the verify.mjs CLI must run when invoked from a path containing
// characters that are URL-escaped in import.meta.url (e.g. a space). It used to
// compare against a hand-built `file://` string, never matched, printed nothing
// and exited 0 -- indistinguishable from "valid" for a calling script.
//
//   node --test tests/verify-cli.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const EXAMPLES = resolve(dirname(fileURLToPath(import.meta.url)), "..", "examples");

test("verify.mjs CLI runs from a path containing a space", () => {
  const root = join(mkdtempSync(join(tmpdir(), "attest-")), "with space");
  try {
    mkdirSync(join(root, "tools"), { recursive: true });
    for (const f of ["verify.mjs", "canonicalize.mjs"]) {
      cpSync(join(EXAMPLES, "tools", f), join(root, "tools", f));
    }
    cpSync(join(EXAMPLES, "keys.json"), join(root, "keys.json"));

    const run = (receipt) =>
      spawnSync(process.execPath, [join(root, "tools", "verify.mjs"), join(EXAMPLES, "receipts", receipt)], {
        encoding: "utf8",
      });

    const valid = run("valid.json");
    assert.equal(valid.status, 0);
    assert.equal(JSON.parse(valid.stdout).result, "valid");

    const tampered = run("tampered.json");
    assert.equal(tampered.status, 1);
    assert.equal(JSON.parse(tampered.stdout).result, "tampered");
  } finally {
    rmSync(dirname(root), { recursive: true, force: true });
  }
});
