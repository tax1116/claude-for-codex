---
phase: "02"
slug: async-job-reliability-and-testable-packaging
status: ready-for-planning
created: 2026-06-09
---

# Phase 2 - Context

## Phase Boundary

Phase 2 makes long Claude runs predictable without requiring a live Claude
account in automated tests.

This phase covers background job lifecycle behavior, fake-Claude runner tests,
package contents, and user-facing examples for status/result/cancel flows.

This phase does not add default hook automation, write-capable rescue as a
standard path, hosted queues, or marketplace distribution polish.

## Locked Decisions

- Background jobs are local process-lifetime jobs, not durable hosted queue
  jobs.
- Cancellation is best effort while this MCP server process still owns the
  Claude child process.
- Tests must use deterministic fake Claude fixtures instead of spending live
  Claude usage.
- `StateStore` is the canonical repo-scoped persistence boundary and must not be
  bypassed by new ad hoc job file helpers.
- Existing legacy job-store compatibility must remain intact.
- `npm run ci` remains the single local and GitHub CI command.
- Package dry-run checks must prove every runtime file needed by npm users is
  included.

## Current Baseline

Phase 1 and PR #1 already provide:

- `claude_review`, `claude_adversarial_review`, `claude_rescue`
- `claude_status`, `claude_result`, `claude_cancel`
- `background: true` option on long-running tools
- `StateStore` with canonical state root and legacy job reads
- Node built-in `node:test` coverage for docs/runtime contracts and StateStore
- `npm run ci` across lint, syntax checks, node tests, and npm pack dry-run

Gaps that remain for Phase 2:

- No fake-Claude integration harness around `startJob`.
- No direct tests for foreground/background status/result/cancel tool behavior.
- No deterministic coverage for JSON parsing, text fallback, launch failure,
  timeout, session id persistence, or cancellation output.
- Docs mention background/status/result/cancel, but do not yet provide the full
  Phase 2 example set.
- Package dry-run includes `src/state-store.mjs`, but this needs to stay locked
  as runtime code grows.

## Canonical References

- `.planning/ROADMAP.md` - Phase 2 goal and success criteria.
- `.planning/REQUIREMENTS.md` - JOB-01..JOB-05, QUAL-01..QUAL-06, DOC-03.
- `server.mjs` - MCP tool registration and current job runner.
- `src/state-store.mjs` - canonical job persistence boundary.
- `test/state-store.test.mjs` - current StateStore behavior tests.
- `test/runtime-contract.test.mjs` - current source-level runtime contract tests.
- `test/docs-rollout-contract.test.mjs` - current docs/package contract tests.
- `README.md`, `docs/SETUP.md`, `docs/DESIGN.md` - user-facing docs to extend.
- `docs/superpowers/specs/2026-06-08-claude-for-codex-review-design.md` -
  source design notes for runner, job, and fake-Claude testing expectations.

## Specific Ideas

- Extract a small runner seam from `server.mjs` only if needed for fake-Claude
  tests; keep public MCP tool behavior stable.
- Prefer temporary directories and temporary fake Claude binaries in tests.
- Use `CLAUDE_BIN`, `CLAUDE_FOR_CODEX_STATE`, and `CLAUDE_TIMEOUT_MS` to avoid
  touching the user's real state.
- Keep status names compatible with existing output, but normalize persisted job
  state through `StateStore`.
- Keep package checks in tests so new runtime files cannot be forgotten.

## Deferred Ideas

- `claude_followup` remains a follow-up phase unless Phase 2 tasks finish early
  and the roadmap is explicitly updated.
- Hook setup and hook tests remain Phase 3.
- Public marketplace release polish remains outside this phase.
