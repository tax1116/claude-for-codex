---
phase: 01-manual-design-risk-review-core
plan: "01"
subsystem: runtime
tags: [mcp, claude-code, review, diagnostics, tdd]

requires: []
provides:
  - Read-only Claude review runtime contract
  - Explicit Codex-to-Claude context prompt contract
  - Runtime setup and failure guidance for local Claude Code invocation
affects: [phase-1, runtime, docs, slash-commands]

tech-stack:
  added: []
  patterns:
    - Node built-in test runner for source-level runtime contract tests
    - Shared prompt instructions for read-only review tools

key-files:
  created:
    - test/runtime-contract.test.mjs
  modified:
    - package.json
    - server.mjs
    - test/runtime-contract.test.mjs

key-decisions:
  - "Use Node's built-in node:test runner rather than adding a third-party test dependency."
  - "Keep review and adversarial review on the existing read-only MCP permission path."
  - "Treat Claude context as explicit repository and planning-file context, not full Codex chat transfer."

patterns-established:
  - "Runtime contracts are covered by source-level tests until server internals are split for direct unit testing."
  - "Review result formatting appends a read-only footer for review and adversarial-review jobs."
  - "Setup diagnostics name the effective Claude binary, model, timeout, MCP timeout alignment, and live-review caveats."

requirements-completed: [SETUP-03, SETUP-04, REV-01, REV-02, REV-03, REV-04, REV-05, REV-06, CTX-01, CTX-02, CTX-03, CTX-04, SAFE-01, SAFE-02]

duration: 5min
completed: 2026-06-08
---

# Phase 1 Plan 1: Runtime Review Contract Summary

**Read-only Claude review tools now carry explicit Codex context, severity/output rules, focus narrowing, and operator-facing setup/failure diagnostics.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-06-08T17:52:56+09:00
- **Completed:** 2026-06-08T17:57:17+09:00
- **Tasks:** 4
- **Files modified:** 3

## Accomplishments

- Added a RED contract test suite with Node's built-in `node:test`, then made it pass without adding dependencies.
- Added optional `focus` to `claude_review` while keeping `allowWrite: false` for both review tools.
- Added explicit prompt context: no full Codex chat transfer, current planning docs, git status, untracked files, severity labels, and clean-review wording.
- Added read-only result footer and actionable failure guidance for missing binary, auth/reachability, timeout, malformed JSON/text fallback, and context size.
- Expanded `claude_setup` output to report `CLAUDE_BIN`, `CLAUDE_MODEL`, `CLAUDE_TIMEOUT_MS`, MCP `tool_timeout_sec`, auth next steps, and live-review caveats.

## Task Commits

1. **RED: runtime contract tests** - `f9a6e64` (test)
2. **GREEN: runtime review contract** - `9bf9f3f` (feat)

## Files Created/Modified

- `package.json` - `npm test` now runs syntax checks plus Node tests.
- `server.mjs` - Adds review context/output helpers, focus support, read-only footer, setup diagnostics, timeout tracking, and failure guidance.
- `test/runtime-contract.test.mjs` - Covers Phase 1 runtime contract strings and read-only tool shape.

## Decisions Made

- Used Node's built-in `node:test` runner to avoid adding dependencies for the first contract tests.
- Kept the server monolithic for Phase 1 because the plan asks for runtime contract behavior, not an internal module split.
- Appended read-only status in `fmtJob` for review jobs so even malformed Claude output cannot imply edits.

## Deviations from Plan

None - plan executed as written.

## Issues Encountered

- `npm run lint` initially failed because ESLint did not know the test file's `URL` global. Fixed by importing `URL` from `node:url`.
- Spawn launch failures could be overwritten by a later `close` event. Fixed by returning early when a job is no longer `running`.

## Verification

- Targeted runtime contract test - passed after GREEN implementation.
- `npm test` - passed.
- `npm run lint` - passed.
- `node --check server.mjs` - passed.
- `npm run pack:check` - passed.
- `rg "High|Medium|Low|No high-confidence findings" server.mjs` - found matches.
- `rg "no files were edited|full Codex chat|tool_timeout_sec|git status --short --branch" server.mjs` - found matches.

## TDD Gate Compliance

- RED commit present: `f9a6e64`.
- GREEN commit present: `9bf9f3f`.
- No REFACTOR commit was needed; cleanup stayed inside the GREEN fix and tests remained green.

## User Setup Required

None - no external service configuration required by this plan.

## Next Phase Readiness

Ready for `01-02-PLAN.md`. The docs and slash-command prompts can now describe the runtime behavior that exists in `server.mjs`.

---
*Phase: 01-manual-design-risk-review-core*
*Completed: 2026-06-08*
