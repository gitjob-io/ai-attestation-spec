# ai-attestation-spec — ROADMAP

> ⭐ **SINGLE SOURCE OF TRUTH.** On any handoff or fresh session, **read this first and follow
> only this** for what's left, what's next, phases, acceptance criteria, and decisions. There are
> **no other `*_PLAN` / handoff docs** — they were consolidated into this file. If another doc's
> status ever conflicts with this one, **this wins.**
>
> - **Spec / reference** (never-touch, hard-excluded — the product itself):
>   `SPEC.md`, `CONTRIBUTING.md`, `examples/README.md`
> - **Decisions**: `DECISIONS.md` (append-only log; roadmap items cite it by date + title)

**Legend:** ✅ done · 🔶 shipped but UNVERIFIED · ⏳ in progress · ⬜ not started · 🔬 verification
owed · 🔁 superseded (kept for its evidence, not as work) · ⛔ **BLOCKS** — the only marker that
gates anything

**Backlog items are not blockers.** No item under a `BACKLOG` / `PARKED` status may be cited as
gating, blocking, or holding up any other work unless it carries a `⛔ BLOCKS:` line with the
owner's verbatim instruction. Absent that line, treat it as non-blocking. An agent that reports
a parked item as a blocker is misreading this file.

**Contents:** §0 Do next · §1 Open items · Appendix

## §0 Do next

> ### ▶ RESUME HERE — 2026-10-01
>
> **State:** on `main`, in sync with `origin`. Two gates, both run in CI
> (`.github/workflows/conformance.yml`): `node tests/run-vectors.mjs` (4/4 conformance vectors)
> and `node --test` (examples conform to their schemas, verify as named, and regenerate
> byte-identically; verifier CLI regression). `SPEC.md:59` still lists `@gitjob/attest` as a forward commitment — left
> deliberately; SPEC.md is never-touch.
>
> **Two spec defects are open — both are YOUR call, not editorial fixes.** Full write-up in
> `tests/README.md` § Known divergence.
>
> 1. **Schema vs. reference receipt shape.** Published `SPEC.md` + `examples/schema/receipt.schema.json`
>    are v0.1 with 7 fields and `"additionalProperties": false`; the reference implementation's
>    vectors are v0.3 and add `nonce` (plus optional `weight_hash`). Signatures verify; schema
>    validation rejects them. Either (a) add `nonce`/`weight_hash` to schema + SPEC.md and bump
>    toward v0.3 (matches reality, likely answer), or (b) regenerate vectors against v0.1.
> 2. **Verification precedence.** The Go reference (`gitjob.io:internal/attest/verify.go`) uses
>    `unknown_key > revoked > tampered > valid` with revocation judged *as of `issued_at`*;
>    `examples/tools/verify.mjs` and `examples/README.md` use `unknown_key > tampered > revoked >
>    valid` and ignore `issued_at`. The four vectors don't exercise the difference; a receipt
>    issued before its key's revocation is `valid` in one and `revoked` in the other. Pick one,
>    then align the other and add a vector that pins it.
>
> **▶ Next, in order.** Decide 1 and 2 → align schema/verifier/vectors → (optional) build and
> publish the TypeScript `@gitjob/attest` package, gated on `tests/run-vectors.mjs` → the spec is
> clean enough to lead outreach.

## §1 Open items

(none found — clean seed install)

## Appendix — consolidation history

No rival plan/backlog/handoff docs existed in this repo at install time (`git ls-files '*.md'`
returned only `README.md`, `SPEC.md`, `CONTRIBUTING.md`, `examples/README.md`). Nothing was
folded or deleted. This roadmap was seeded fresh by the `doc-consolidation` sweep (2026-08-07).
