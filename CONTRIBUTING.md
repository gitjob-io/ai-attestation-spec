# Contributing

Thanks for your interest. This repository hosts a draft specification, so most contributions take the form of issues, comments, and proposals against the spec text — not code.

## Kinds of contributions wanted

- **Editorial corrections.** Typos, grammar, ambiguous phrasing, broken links. PR directly against `SPEC.md`.
- **Clarification questions.** Anywhere the spec is ambiguous, underspecified, or contradicts itself. File an issue with the `clarification` label.
- **Substantive proposals.** Additions, changes, or alternative designs. File an issue with the `proposal` label describing the problem and the proposed change. PRs are welcome, but discuss first if the change is non-trivial.
- **Implementation notes.** If you've implemented or attempted to implement the spec and hit something that doesn't work, file an issue with the `implementation` label.
- **Conformance test cases.** Examples of receipts that should and should not verify, with rationale.

## Filing issues

One issue per topic. Include:

- What you encountered, or what you want to change
- Where in the spec it appears (section, line, or version)
- What you expected, or what you propose instead

Combining unrelated points in a single issue makes them harder to resolve. Split them.

## Proposing changes

For anything beyond editorial cleanup, the rough process is:

1. Open an issue describing the problem.
2. Discussion happens in the issue.
3. If consensus emerges, a PR against `SPEC.md` lands the change.
4. Substantive changes bump the spec version and are noted in the changelog.

Until the project formalizes an RFC process, maintainers make final calls. The bar for accepting a substantive change is: does this make the spec better for any provider implementing it? Provider-specific concerns belong in implementation repositories, not in the spec.

## Norms

- **Be specific.** "This is unclear" is less useful than "this is unclear because X could mean Y or Z."
- **Be patient.** This is a part-time project. Response times reflect that.
- **Be skeptical, including of your own proposals.** A spec earns its weight by being narrow and durable. Additions have to clear a real bar.

## Code of conduct

Treat people the way you'd want to be treated when you're new and asking a question you're not sure is dumb. A formal Code of Conduct will be adopted as the project grows.

## License of contributions

By contributing, you agree that your contributions are licensed under the MIT License (see [LICENSE](./LICENSE)).