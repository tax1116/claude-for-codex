---
phase: "02"
slug: async-job-reliability-and-testable-packaging
status: researched
created: 2026-06-09
---

# Phase 2 - Research

## Current Implementation Findings

`server.mjs` already has the product surface for Phase 2:

- `startJob` spawns `CLAUDE_BIN` with JSON output.
- Foreground calls wait for `done`; background calls return a task id.
- `claude_status` lists recent jobs or one requested job.
- `claude_result` returns the latest finished job or a requested job.
- `claude_cancel` kills an active child when this server process still owns it.
- Failure guidance covers missing binary, auth/reachability, timeout, malformed
  JSON, and context-too-large cases.

`src/state-store.mjs` is the new persistence boundary:

- Resolves canonical state root with `CLAUDE_FOR_CODEX_STATE`.
- Keeps legacy reads from `CLAUDE_FOR_CODEX_STORE`, `CODEX_CC_STORE`, and the old
  default jobs directory.
- Stores canonical jobs under a repo slug plus realpath hash.
- Tracks a pruned job summary in `state.json`.
- Provides latest completed review lookup.

## Gaps

- `startJob` is not directly testable without loading the MCP server entrypoint.
- The server connects to stdio at module top level, which makes importing
  helpers from tests awkward.
- Fake-Claude behavior needs to cover both JSON and non-JSON outputs.
- Timeout tests need small, test-controlled values and should not sleep for real
  production timeout lengths.
- Cancellation should explicitly document that it only works while the current
  MCP process owns the child.
- Package checks currently verify README-linked docs, but not every runtime code
  path as new source files are added.

## Recommended Implementation Shape

1. Introduce testable seams without a full TypeScript migration.
   - Keep ESM JavaScript.
   - Extract job runner helpers only as far as tests require.
   - Avoid adding dependencies for test doubles.

2. Build deterministic fake-Claude tests.
   - Create a temporary executable in test setup.
   - Use env vars to point `CLAUDE_BIN` and `CLAUDE_FOR_CODEX_STATE` at fixtures.
   - Have fake Claude emit Claude-style JSON, text fallback, delayed output,
     non-zero exits, and session ids.

3. Lock job lifecycle behavior.
   - Foreground review writes a completed job.
   - Background review returns task id immediately.
   - Status lists running/recent jobs for the current repo.
   - Result returns final output and session resume hint.
   - Cancel marks running jobs as cancelled and states process-lifetime limits.

4. Keep package and docs contracts close to user behavior.
   - Docs must include examples for design review, adversarial focus review,
     base-ref review, background review, status, result, and cancel.
   - `npm pack --dry-run` must include `server.mjs`, `src/`, prompts, docs,
     hook, `LICENSE`, and `NOTICE`.

## Risk Notes

- Running a real Claude command in CI would be flaky, expensive, and environment
  dependent. Fake Claude is mandatory.
- Over-promising cancellation durability would create a false safety guarantee.
- Pulling too much logic out of `server.mjs` before tests exist could create
  churn; extract only where it unlocks deterministic tests.

## Verification Strategy

- `npm run ci`
- fake-Claude node tests for runner and job lifecycle
- source assertions for cancellation/process-lifetime wording
- docs tests for required examples
- package dry-run assertion for runtime files
