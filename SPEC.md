# Attested AI-Assisted Work

**Draft Specification · v0.1**

**Status:** Open for Comment
**Last updated:** 05/03/2026

A receipt format for verifiable AI-assisted work. Model-provider neutral.

---

## Context

Modern LLM providers operate the inference, hold the signing keys, and increasingly run native client attestation in their first-party tooling. Confidential inference attests server-side integrity. What's missing is the inverse surface: a receipt the server returns to the client proving *this prompt produced this output on this model at this time*. This spec proposes that surface in a form any model provider can implement.

---

## Primitive — the signed receipt

```
Receipt {
  receipt_id     : uuid          // unique per completion
  model_id       : string        // canonical model identifier (provider-namespaced)
  prompt_hash    : sha256        // hash of canonicalized request body
  output_hash    : sha256        // hash of full response body
  issued_at      : iso8601
  key_id         : string        // public-key reference for verification
  signature      : ed25519       // signature over the above fields
}
```

Prompt and output are *hashed*, not stored — content stays private; verifiability is preserved.

A machine-readable JSON Schema for this struct, with concrete field encodings, lives at [`examples/schema/receipt.schema.json`](./examples/schema/receipt.schema.json). Signed reference payloads for each verification result are under [`examples/`](./examples/).

---

## API surface (proposed)

The spec is transport-agnostic; the shape below is a representative HTTP mapping. Providers may bind it onto their existing completion endpoints.

- `POST {completion_endpoint}` — response includes an optional top-level `receipt` field when the client opts in via `X-Receipt-Request: true`
- `GET /v1/receipts/{receipt_id}/verify` — public endpoint, returns `{ status, key_id, issued_at }`
- `GET /v1/receipts/keys` — public key set with rotation history

---

## Verification flow

1. Client receives the receipt alongside the completion.
2. Third party (gitjob.io or another consumer) hashes the prompt and output it was shown.
3. Hashes are compared against the receipt; signature is verified against the published key set.
4. Result: `valid`, `tampered`, `unknown_key`, or `revoked`.

---

## Reference implementation — gitjob.io commits to

- Open-source receipt verifier library (`@gitjob/attest`, MIT)
- Public spec hosted at `gitjob.io/spec/attest`, versioned, with change log
- Conformance test suite for receipt issuers and verifiers
- First production consumer: gitjob.io's credentialing engine, with a public verifier dashboard

**Posture:** spec, verifier, and test suite published under MIT. Receipt issuance remains the model provider's; verification is public. Anyone can verify, nobody can forge.

---

## Open questions — for implementing providers

- Multi-turn semantics: per-turn receipts vs. session-scoped bundle
- Tool-use scope: does the receipt cover tool inputs and outputs, or only the model's own tokens?
- Key rotation cadence and revocation surface
- Privacy posture: opt-in default, opt-out, or per-deployment policy

---

Justin Higgins · justin.c.higgins@gmail.com · [gitjob.io](https://gitjob.io)
