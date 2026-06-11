---
slug: document-semver-policy-for-pre-1-0-team
status: complete
completed: 2026-06-11
---

# Summary

Documented the release-versioning decision: the project uses Semantic
Versioning for package releases, but v1/v2 remain product milestone labels.
Package releases should stay in `0.x.y` until install, skill review,
repo-read consent, cancellation, docs, CI, and package contents have survived
real team use.

## Changed Files

- `docs/PUBLISHING.md`
- `README.md`
- `.planning/PROJECT.md`
- `.planning/ROADMAP.md`
- `.planning/STATE.md`
- `test/docs-rollout-contract.test.mjs`

## Verification

- `npm test` failed once because the exact contract-test phrase crossed
  a Markdown line break; docs were clarified and the check was rerun.
- `npm test` passed after the clarification.
- `npm run lint` passed.
