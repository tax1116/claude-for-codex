---
phase: 01-manual-design-risk-review-core
plan: "02"
subsystem: docs
tags: [slash-commands, mcp, docs, rollout, tdd]

requires:
  - phase: 01-01
    provides: Runtime read-only Claude review contract and setup diagnostics
provides:
  - Slash-command-first team rollout documentation
  - Prompt wrappers aligned to implementation-risk and adversarial review modes
  - Explicit context, read-only, hook, and rescue boundaries in durable docs
affects: [phase-1, docs, prompts, team-rollout]

tech-stack:
  added: []
  patterns:
    - Node built-in test runner for docs and prompt contract tests
    - Slash commands as standard UX with MCP tool names as reference interface

key-files:
  created:
    - test/docs-rollout-contract.test.mjs
  modified:
    - README.md
    - docs/SETUP.md
    - docs/DESIGN.md
    - prompts/claude-review.md
    - prompts/claude-adversarial.md

key-decisions:
  - "Document slash commands as the standard team path and MCP tool names as the reference interface."
  - "Keep hooks and write-capable rescue outside default onboarding."
  - "Keep docs explicit that Claude does not receive the full Codex chat automatically."

patterns-established:
  - "Docs-facing behavior is protected by source-level document contract tests."
  - "Prompt wrappers name optional base/focus arguments and background usage without hiding MCP tool names."
  - "Setup and design docs list failure categories in the same vocabulary as runtime output."

requirements-completed: [SETUP-01, SETUP-02, REV-01, REV-02, REV-03, REV-04, REV-05, REV-06, CTX-01, CTX-02, CTX-03, CTX-04, SAFE-01, SAFE-02, DOC-01, DOC-02, DOC-04]

duration: 4min
completed: 2026-06-08
---

# Phase 1 Plan 2: Slash-Command Team Rollout Summary

**Team onboarding now teaches manual slash commands first while preserving MCP tool names, explicit context boundaries, and advanced opt-in automation warnings.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-06-08T18:02:31+09:00
- **Completed:** 2026-06-08T18:06:02+09:00
- **Tasks:** 4
- **Files modified:** 6

## Accomplishments

- Added a RED docs rollout contract test, then rewrote prompts and docs until it passed.
- Reframed README onboarding around Node.js setup, absolute-path MCP registration, setup checks, prompt copy, and first manual review examples.
- Rewrote prompt wrappers so the standard team path is implementation-risk review or adversarial design critique, with optional `base`, `focus`, and `background: true`.
- Added setup/design documentation for explicit context, read-only boundaries, `resume` semantics, selected planning docs, failure categories, hook risks, and write-capable rescue boundaries.
- Removed v1-facing TypeScript migration language from rollout docs while keeping future migration deferred.

## Task Commits

1. **RED: docs rollout contract tests** - `bbc577c` (test)
2. **GREEN: slash-command rollout docs** - `19b4f67` (docs)

## Files Created/Modified

- `README.md` - Introduces slash-command-first team rollout, MCP tool names as reference interface, context boundary, and advanced opt-in hook warnings.
- `docs/SETUP.md` - Adds standard slash-command workflow, setup diagnostics, failure categories, resume semantics, and safety boundary.
- `docs/DESIGN.md` - Adds explicit context contract, review mode boundaries, failure categories, and deferred TypeScript posture.
- `prompts/claude-review.md` - Defines the implementation-risk slash wrapper contract.
- `prompts/claude-adversarial.md` - Defines the adversarial design critique slash wrapper contract.
- `test/docs-rollout-contract.test.mjs` - Covers the docs and prompt rollout contract.

## Decisions Made

- Treated slash commands as the default team learning path and MCP tools as the precise reference layer.
- Kept hooks documented only as advanced opt-in automation due to loop, blocking, and usage-cost risk.
- Kept `claude_rescue` and `allow_write` outside the default read-only review path.

## Deviations from Plan

None - plan executed as written.

## Issues Encountered

- The first GREEN run failed because README used only capitalized `Advanced`. Added lowercase `advanced` wording so the docs contract is explicit and stable.

## Verification

- Docs rollout contract test - passed after GREEN implementation.
- `npm run ci` - passed.
- Slash/MCP reference grep - passed.
- Context/read-only wording grep - passed.
- Non-affiliation wording grep - passed.
- `git diff --check` - passed.

## TDD Gate Compliance

- RED commit present: `bbc577c`.
- GREEN commit present: `19b4f67`.
- No REFACTOR commit was needed.

## User Setup Required

None - docs now describe the manual setup steps, but this plan does not require external configuration.

## Next Phase Readiness

Phase 1 is complete. The next workflow step should validate Phase 1 artifacts before moving to Phase 2.

---
*Phase: 01-manual-design-risk-review-core*
*Completed: 2026-06-08*
