# Attested AI-Assisted Work

A draft specification for verifiable receipts of AI-assisted work. Model-provider neutral.

**Status:** Draft v0.1 · Open for Comment

---

## What this is

A specification for a signed receipt that an LLM provider returns to a client, proving that a given prompt produced a given output on a given model at a given time. Prompt and output are hashed, not stored — verifiability without disclosure.

The full specification lives in [SPEC.md](./SPEC.md).

## Why

LLM providers already attest server-side integrity (confidential inference, native client attestation). What's missing is the inverse surface: a receipt the client can hand to a third party to verify the work was real. Hiring, credentialing, and any downstream consumer of AI-assisted work needs this guarantee, and no public standard currently provides it.

## What's in this repository

- `SPEC.md` — the specification itself
- `CONTRIBUTING.md` — how to participate
- `LICENSE` — MIT
- *(planned)* `examples/` — reference receipt payloads and verification walkthroughs
- *(planned)* `tests/` — conformance test suite for issuers and verifiers

The reference implementation library (`@gitjob/attest`) lives in a separate repository.

## Status and stability

Draft v0.1. Expect breaking changes until v1.0.

Spec versioning follows semver, applied to the specification rather than any single implementation: a major bump for breaking changes to the receipt format or verification flow, a minor bump for additions, a patch bump for clarifications and editorial changes.

The spec has not yet been adopted by any model provider. gitjob.io is building the first production consumer and will publish a verifier dashboard alongside it.

## Participate

Issues, clarification questions, and substantive proposals are welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md) for how this repository works.

## License

MIT. See [LICENSE](./LICENSE).
