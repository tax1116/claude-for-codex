---
phase: 02-async-job-reliability-and-testable-packaging
plan: "02"
subsystem: docs
tags: [docs, packaging, background-jobs, npm]

requires:
  - phase: 02-01
    provides: Testable fake-Claude lifecycle and cancellation contract
provides:
  - Background review lifecycle documentation
  - Runtime helper package coverage tests
  - Canonical state env documentation
affects: [phase-2, docs, package-contract, tests]

tech-stack:
  added: []
  patterns:
    - Docs contract tests for user-facing workflow examples
    - Package files coverage for server runtime imports

key-files:
  modified:
    - README.md
    - docs/SETUP.md
    - docs/DESIGN.md
    - test/docs-rollout-contract.test.mjs

key-decisions:
  - "Keep slash commands first while showing MCP status/result/cancel as the reference lifecycle."
  - "Document CLAUDE_FOR_CODEX_STATE as canonical and CLAUDE_FOR_CODEX_STORE/CODEX_CC_STORE as legacy read paths."
  - "State that cancellation is best effort and process-lifetime only, not a hosted durable queue."

patterns-established:
  - "Docs tests must cover base, focus, background, status, result, cancel, and cancellation boundary examples."
  - "Package tests must prove server runtime imports are covered by package.json files entries."

requirements-completed: [JOB-01, JOB-02, JOB-03, JOB-04, JOB-05, QUAL-05, QUAL-06, DOC-03]

duration: 8min
completed: 2026-06-09
---

# Phase 2 Plan 2: Package And Background Workflow Documentation Summary

**Team docs now show the full background review lifecycle and package tests protect extracted runtime helpers.**

## Accomplishments

- Added README and setup examples for base-ref review, focused adversarial review, background review, status, result, and cancel.
- Documented cancellation as best effort and process-lifetime only while the MCP server owns the Claude child process.
- Updated design docs to describe canonical `CLAUDE_FOR_CODEX_STATE`, legacy read paths, background execution, and cancellation boundaries.
- Added docs tests for base/focus/background examples and cancellation warnings.
- Added package contract tests that ensure server runtime imports under `src/` are covered by `package.json.files`.

## Files Created/Modified

- `README.md` - Adds background lifecycle example and canonical state env.
- `docs/SETUP.md` - Adds concrete slash/MCP examples and cancellation semantics.
- `docs/DESIGN.md` - Updates job store mechanics and cancellation contract.
- `test/docs-rollout-contract.test.mjs` - Locks docs examples and package coverage for runtime imports.

## Deviations from Plan

None - plan executed as written.

## Verification

- `node --test test/docs-rollout-contract.test.mjs` - passed.
- `rg "base=|focus=|background: true|claude_status|claude_result|claude_cancel|process-lifetime|durable queue" README.md docs test src server.mjs` - found expected examples and warnings.
- `npm run ci` - passed.
- `npm pack --dry-run --cache ./.npm-cache` - passed and included `src/claude-runner.mjs`.

## Next Phase Readiness

Phase 2 implementation is ready for PR review and Phase 2 validation.

---
*Phase: 02-async-job-reliability-and-testable-packaging*
*Completed: 2026-06-09*
