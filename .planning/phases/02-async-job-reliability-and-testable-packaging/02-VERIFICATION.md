---
phase: 02-async-job-reliability-and-testable-packaging
verified: 2026-06-09T01:38:57Z
status: passed
score: 12/12 requirements verified
---

# Phase 2 Verification - Async Job Reliability And Testable Packaging

## Goal Achievement

**Goal:** Users can run long Claude reviews through predictable background jobs,
and maintainers can verify the job, runner, and package contract without a live
Claude account.

**Status:** Passed.

Phase 2 now has deterministic fake-Claude lifecycle tests, a testable runner
module, process-lifetime cancellation semantics, background workflow docs, and
package checks that include every runtime helper needed by npm users.

## Observable Truths

| Truth | Status | Evidence |
|-------|--------|----------|
| Background review can return a task id immediately and expose status/result/cancel commands. | verified | `src/claude-runner.mjs`, `test/job-lifecycle.test.mjs` |
| Status and result are repo-scoped through StateStore and can be tested with temp state roots. | verified | `src/claude-runner.mjs`, `src/state-store.mjs`, `test/job-lifecycle.test.mjs` |
| JSON output, session id, cost, turn count, malformed text fallback, non-zero exit, missing binary, and timeout behavior are deterministic under fake Claude. | verified | `test/job-lifecycle.test.mjs` |
| Cancellation is best effort while the current MCP server owns the child process and does not promise durable queue semantics. | verified | `src/claude-runner.mjs`, `README.md`, `docs/SETUP.md`, `docs/DESIGN.md`, tests |
| Package dry-run includes `server.mjs`, `src/claude-runner.mjs`, `src/state-store.mjs`, docs, prompts, hook, `LICENSE`, and `NOTICE`. | verified | `npm run ci`, `test/docs-rollout-contract.test.mjs` |

## Requirements Coverage

| Requirement | Status | Evidence |
|-------------|--------|----------|
| JOB-01 | satisfied | Background runner returns a task id and command hints immediately. |
| JOB-02 | satisfied | `statusText` lists running/recent jobs for the repo. |
| JOB-03 | satisfied | `resultText` returns final output plus Claude resume session hint. |
| JOB-04 | satisfied | `cancelJob` cancels live owned jobs and documents the process-lifetime limit. |
| JOB-05 | satisfied | Jobs and last session are persisted through `StateStore`. |
| QUAL-01 | satisfied | Fake-Claude JSON test verifies result, session id, cost, and turns. |
| QUAL-02 | satisfied | Malformed JSON text fallback is covered. |
| QUAL-03 | satisfied | Non-zero exit, missing binary, and timeout guidance are covered. |
| QUAL-04 | satisfied | Tests use temporary repos and `CLAUDE_FOR_CODEX_STATE`, not user state. |
| QUAL-05 | satisfied | `npm run ci` runs lint, syntax checks, node tests, and pack dry-run. |
| QUAL-06 | satisfied | Package tests assert server runtime imports are covered by `package.json.files`. |
| DOC-03 | satisfied | README/setup/design docs show base, focus, background, status, result, cancel, and cancellation boundaries. |

## Anti-Patterns Found

None blocking.

## Human Verification Required

None for Phase 2 CI and package gates.

Live authenticated Claude behavior remains environment-dependent. Phase 2
intentionally proves local lifecycle behavior through fake-Claude tests rather
than spending live Claude usage or requiring a teammate's local auth state.

## Verification Metadata

| Check | Result |
|-------|--------|
| `node --test test/job-lifecycle.test.mjs` | passed; 6 passed, 0 failed |
| `node --test test/docs-rollout-contract.test.mjs` | passed; 6 passed, 0 failed |
| `npm test` | passed; 19 passed, 0 failed |
| `npm run lint` | passed |
| `npm run ci` | passed; package dry-run included 15 files |
| Source assertion: lifecycle wording | passed |

## Fresh Evidence

Collected on 2026-06-09T01:38:57Z:

```text
npm run ci
tests 19
pass 19
fail 0
npm pack --dry-run --cache ./.npm-cache
total files: 15
```

```text
rg "base=|focus=|background: true|claude_status|claude_result|claude_cancel|process-lifetime|durable queue" README.md docs test src server.mjs
```

The source assertion found the expected examples and cancellation boundary
wording.
