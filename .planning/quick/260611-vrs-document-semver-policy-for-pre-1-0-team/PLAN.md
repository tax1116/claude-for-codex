---
slug: document-semver-policy-for-pre-1-0-team
status: complete
created: 2026-06-11
---

# Quick Task: Document SemVer policy for pre-1.0 team rollout releases

## Goal

Clarify that product milestone labels such as v1/v2 are separate from npm
package versions. Keep package releases in `0.x.y` until team usage proves the
workflow stable enough for a first stable `1.0.0`.

## Scope

- Add versioning policy to publishing docs.
- Add a short README note so users do not read "v1" as npm `1.0.0`.
- Sync planning docs with the decision.
- Add a docs contract test so the policy does not disappear accidentally.

## Verification

- `npm test`
- `npm run lint`
