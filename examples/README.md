# examples/

Machine-readable schemas and canonical reference payloads for the
[Attested AI-Assisted Work](../SPEC.md) receipt format. Everything here is
concrete and verifiable: the example receipts carry real Ed25519 signatures, and
the reference verifier reproduces each of the four results defined in the spec.

## Layout

```
examples/
├── schema/
│   ├── receipt.schema.json        JSON Schema (2020-12) for the Receipt primitive
│   ├── key-set.schema.json        JSON Schema for GET /v1/receipts/keys
│   └── verify-result.schema.json  JSON Schema for GET /v1/receipts/{id}/verify
├── keys.json                      published key set (one active, one revoked key)
├── receipts/
│   ├── valid.json                 verifies as `valid`
│   ├── tampered.json              verifies as `tampered`
│   ├── unknown_key.json           verifies as `unknown_key`
│   └── revoked.json               verifies as `revoked`
└── tools/
    ├── canonicalize.mjs           the canonical signing input
    ├── verify.mjs                 reference verifier (no dependencies)
    └── generate.mjs               deterministically regenerates the fixtures
```

## Field encodings

The [SPEC.md](../SPEC.md) Receipt struct names field *types*; the schema pins
their concrete *encodings*. These are normative for v0.1:

| Field         | Type       | Encoding                                                        |
| ------------- | ---------- | -------------------------------------------------------------- |
| `receipt_id`  | uuid       | lowercase canonical UUID string (RFC 4122)                     |
| `model_id`    | string     | provider-namespaced, e.g. `anthropic/claude-opus-4-8`          |
| `prompt_hash` | sha256     | `sha256:` + 64 lowercase hex chars                             |
| `output_hash` | sha256     | `sha256:` + 64 lowercase hex chars                             |
| `issued_at`   | iso8601    | RFC 3339 UTC timestamp                                         |
| `key_id`      | string     | resolved against the published key set                        |
| `signature`   | ed25519    | 64 raw bytes, base64url-encoded **without padding** (86 chars) |

Public keys in `keys.json` are 32 raw Ed25519 bytes, base64url without padding
(43 chars).

## Canonical signing input

The signature covers every receipt field **except `signature`**, serialized as
canonical JSON: keys sorted lexicographically, no insignificant whitespace,
UTF-8. Because every signed field is a string, this is a deterministic subset of
[RFC 8785](https://www.rfc-editor.org/rfc/rfc8785) (JSON Canonicalization
Scheme) — sorted-key `JSON.stringify` already yields the JCS form. See
[`tools/canonicalize.mjs`](./tools/canonicalize.mjs). A future spec revision that
introduces non-string fields must adopt full RFC 8785.

## Verification results and precedence

Given a receipt and the published key set, the verifier returns exactly one
result. Precedence is deliberate:

1. **`unknown_key`** — `key_id` is not in the published key set. A key must be
   known before a signature can be checked.
2. **`tampered`** — the signature does not verify over the canonical signing
   input (a field was altered after issuance).
3. **`revoked`** — the signature is intact but the key's `status` is `revoked`.
4. **`valid`** — the key is active and the signature verifies.

`tampered` is checked before `revoked` so that `revoked.json` (a genuinely
signed receipt whose key was later retired) reaches the revocation check instead
of being masked as tampered.

## Reproducing and checking the fixtures

No dependencies — Node's built-in crypto only.

```sh
# Verify a receipt against the published key set:
node examples/tools/verify.mjs examples/receipts/valid.json
# -> { "result": "valid", "key_id": "...", "issued_at": "..." }

# Regenerate every fixture deterministically (byte-identical output):
node examples/tools/generate.mjs
```

The signing keys in `generate.mjs` are derived from fixed, non-secret test seeds
and exist only to make these examples verifiable. They protect nothing and must
never be used in production.
