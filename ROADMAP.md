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

> ### ▶ RESUME HERE — session handoff 2026-08-07.
>
> **State:** `git status` clean at ROADMAP install time. Repo last committed 2026-07-29. Public
> draft spec (v0.1, "Open for Comment") for signed AI-assisted-work receipts, model-provider
> neutral. Published artifact per [[public-thesis-and-footprint]] memory — part of the public
> outreach corpus.
>
> ### ▶ RESUME HERE — 2026-08-18: the dead-end README claim is FIXED, conformance vectors published, and a real spec defect was found. All uncommitted.
>
> **Context.** An OSS-readiness audit found `README.md` claiming in the present tense that
> "the reference implementation library (`@gitjob/attest`) lives in a separate repository" —
> **false**: no such package exists on npm (404) or in any public repo. This is a public repo, so a
> cold reader following that sentence hit a dead end. That was the blocker on the spec leading any
> outreach.
>
> **What shipped into the tree (uncommitted).**
> 1. **README corrected.** The `@gitjob/attest` sentence now says the packaged library is *planned,
>    not yet published*, and points readers at `examples/tools/verify.mjs` plus the vectors as the
>    working reference. `SPEC.md:59` still lists `@gitjob/attest` under "gitjob.io commits to" —
>    **left deliberately**: that is a forward commitment, not a false statement of current fact, and
>    this repo's `CLAUDE.md` marks SPEC.md never-touch.
> 2. **`tests/` now exists** — the README's `*(planned)*` entry is real. `tests/vectors.json` is the
>    4-case conformance suite copied from the private Go implementation
>    (`gitjob.io:internal/attest/testdata/conformance/`); checked first and it contains only ed25519
>    **public** keys, no secret material. `tests/run-vectors.mjs` drives the reference verifier over
>    them and exits non-zero on mismatch, so it is CI-ready. **Verified by running it: 4/4 pass.**
>    This also discharges one of SPEC.md's three stated commitments ("conformance test suite").
>
> **⚠ A REAL SPEC DEFECT SURFACED — this is YOUR call, not an editorial fix.**
> The reference implementation's receipt shape has drifted ahead of the published spec text:
>
> | | Published (`SPEC.md`, `examples/schema/receipt.schema.json`) | `tests/vectors.json` |
> |---|---|---|
> | Version | Draft v0.1 | v0.3 |
> | Receipt | 7 fields, **`"additionalProperties": false`** | 8 — adds `nonce` (plus `weight_hash` where present) |
>
> Measured, not assumed: every vector **verifies** correctly (4/4) because RFC 8785 canonicalization
> covers whatever fields are present — but a vector receipt **fails schema validation** against the
> published schema, because that schema forbids additional properties and does not define `nonce`.
> **Signature layer compatible, schema layer not.** An implementer who builds to the published
> schema and then meets a real reference receipt gets rejected at validation. Full write-up in
> `tests/README.md`.
>
> **▶ NEXT ACTION, in priority order.**
> 1. **Decide the schema question.** Either (a) add `nonce` and optional `weight_hash` to
>    `examples/schema/receipt.schema.json` + SPEC.md and bump the published version toward v0.3, or
>    (b) regenerate the vectors against the v0.1 shape. (a) matches reality and is the likely answer;
>    (b) keeps v0.1 pure. Bumping a published spec's version is an authorship decision — an agent
>    should not make it.
> 2. **Then commit + push.** The spec is publicly readable, so the false-claim fix is only live once
>    pushed. Until then the dead end is still up.
> 3. **Optional, supersedes the interim fix:** actually build and publish the TypeScript
>    `@gitjob/attest` package (needs npm scope setup; the account already publishes `claude-ace`).
>    Gate it on `tests/run-vectors.mjs` passing.
> 4. Only after 1–2: the spec is clean enough to lead outreach.
>
> #### What shipped
> Draft v0.1 spec: signed-receipt primitive, proposed API surface, verification flow, a
> reference-implementation commitment (gitjob.io).
>
> #### What I found by reading that nobody reported
> No rival plan/backlog/handoff doc existed anywhere in the repo — this is the first roadmap.
>
> #### What I deliberately did NOT do, and why
> Did not fold `SPEC.md`'s "Open questions" section into this roadmap — those are questions
> posed *to* implementing providers as part of the spec's content, not open engineering work
> owned by this repo.

## §1 Open items

(none found — clean seed install)

## Appendix — consolidation history

No rival plan/backlog/handoff docs existed in this repo at install time (`git ls-files '*.md'`
returned only `README.md`, `SPEC.md`, `CONTRIBUTING.md`, `examples/README.md`). Nothing was
folded or deleted. This roadmap was seeded fresh by the `doc-consolidation` sweep (2026-08-07).
