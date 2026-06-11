---
phase: "02"
slug: async-job-reliability-and-testable-packaging
status: mapped
created: 2026-06-09
---

# Phase 2 - Patterns

## Existing Test Patterns

- Tests use Node built-in `node:test` and `node:assert/strict`.
- Source-level contract tests read files with `readFileSync` and assert strings
  or sections.
- StateStore tests create temp git repos with `fs.mkdtempSync` and `git init`.
- No test dependency is required for current coverage.

## Existing Runtime Patterns

- MCP tools are registered in `server.mjs` with zod input schemas.
- Long-running tools share `startJob`, `runForeground`, and `startBackground`.
- User-facing tool output is plain text in `{ content: [{ type: "text" }] }`.
- `StateStore` normalizes old `done` status to `completed`, while current
  `server.mjs` still emits `done` for successful job output.
- Cancellation is backed by an in-memory `live` child-process map plus best
  effort `process.kill(j.pid)`.

## Existing Documentation Patterns

- README teaches slash command workflow before raw MCP reference.
- Setup docs contain task-oriented steps and environment variable tables.
- Design docs explain explicit context and safety boundaries.
- Docs tests enforce critical phrases instead of snapshotting full documents.

## Planning Implications

- Keep Phase 2 tests behavioral and small; avoid snapshots.
- Add fake-Claude tests near runner behavior rather than expanding source-string
  tests for every job path.
- If helper extraction is needed, move reusable logic under `src/` and include it
  in package checks.
- Keep status/result/cancel text stable enough for tests, but not overfit to
  formatting unless it is a product contract.
