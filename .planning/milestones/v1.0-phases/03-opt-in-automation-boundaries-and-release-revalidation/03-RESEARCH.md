---
phase: "03"
slug: opt-in-automation-boundaries-and-release-revalidation
status: researched
created: 2026-06-09
---

# Phase 3 - Research

## Current Implementation Findings

`README.md` and `docs/SETUP.md` already position hooks as advanced opt-in:

- The default rollout steps end at MCP setup, slash prompt copy, and manual
  second-opinion use.
- Hook setup appears in a later advanced section.
- Hook docs include `[features] hooks = true`, `hooks.Stop`, a command path, and
  a timeout.
- Existing warning language mentions loops, blocking, usage cost, experimental
  hooks, and Windows limitations.

`hooks/review-gate.mjs` is intentionally small:

- It reads Codex Stop event JSON from stdin.
- It asks Claude to inspect status, tracked diffs, staged diffs, and untracked
  files.
- It exits `2` on `BLOCK:` and `0` otherwise.
- Its top comment includes opt-in config and warning text.

`server.mjs` and `src/claude-runner.mjs` already preserve the write boundary:

- Review and adversarial review pass `allowWrite: false`.
- `claude_rescue` is the only documented tool that can pass `allow_write`.
- `buildArgs` uses `--dangerously-skip-permissions` only when `allowWrite` is
  true.
- Read-only mode supplies allowed read tools and disallowed edit/write tools.

## Gaps

- Existing tests assert read-only review shape, but do not directly lock the
  write-capable rescue warning boundary.
- Existing docs tests assert "advanced", "opt-in", "loop", "blocking", and
  "usage-cost" in README, but not across setup/design docs or the hook source.
- Docs warn about hooks, but do not yet provide a compact reversibility checklist
  that a teammate can follow.
- Release-facing docs include time-sensitive claims without an explicit
  release-date revalidation table.
- Billing and model alias wording are especially drift-prone and should be
  clearly labeled for release review.

## Recommended Implementation Shape

1. Lock safety boundaries with tests before editing docs.
   - Extend docs contract tests for hook opt-in/reversibility/risk language.
   - Extend runtime source tests for `claude_rescue`, `allow_write`, and
     `--dangerously-skip-permissions`.
   - Avoid live hook execution tests in v1; those are already deferred to v2.

2. Strengthen docs without changing product behavior.
   - Keep default onboarding manual and slash-command-first.
   - Add a short disable/revert checklist for hooks.
   - Put write-capable rescue warning next to every documented `allow_write`
     mention.

3. Add release revalidation markers.
   - Create a table in setup or publishing docs that identifies claims to check
     on release day.
   - Include official source categories to verify: OpenAI Codex CLI/MCP/hook
     docs, Anthropic Claude Code CLI docs, npm/package setup, and billing/model
     docs.
   - Do not assert "latest" facts unless they are checked during the release
     task.

4. Keep package and CI unchanged unless tests require a new file.
   - No new dependency is needed.
   - `npm run ci` remains the local and GitHub gate.

## Risk Notes

- Over-tightening hook language could make the default install sound harder than
  it is; keep the warning near the advanced hook section.
- Under-warning `allow_write` would make a dangerous path look like normal review.
- Release revalidation should not be a stale checklist hidden in planning docs;
  it needs to live in user/release-facing docs.
- Current external CLI/hook/billing facts may change. Execution must re-check
  official docs before final release-facing wording is treated as current.

## Verification Strategy

- `npm run ci`
- docs tests for hook opt-in, reversibility, loop/blocking/usage-cost, and
  release revalidation markers
- runtime/source tests for rescue write boundary and read-only review tools
- source grep for `allow_write`, `--dangerously-skip-permissions`, `hooks`,
  `revalidate`, `billing`, `model`, and `tool_timeout_sec`
