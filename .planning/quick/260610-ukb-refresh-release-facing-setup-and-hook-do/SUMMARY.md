---
quick_id: 260610-ukb
status: complete
completed_at: "2026-06-10T13:03:57Z"
---

# Summary

Refreshed release-facing setup and hook documentation after `dev` was promoted
to `master`.

## Changed

- Updated README and setup docs to point to official Codex/Claude install docs
  instead of npm-only prerequisite commands.
- Updated hook examples to reflect current Codex behavior: hooks are enabled by
  default, `Stop` matcher is unused, and Windows-specific commands use
  `commandWindows`.
- Recorded 2026-06-10 release-date revalidation across README, setup, design,
  publishing, ADR, and GSD codebase integration notes.
- Updated document contract tests for the new release-facing claims.
- Updated `.planning/STATE.md` to record the completed master promotion and the
  current release-doc refresh branch.

## Verification

- `node --test test/docs-rollout-contract.test.mjs`
- `codex --version`
- `codex mcp --help`
- `claude --version`
- `claude --help`
- `claude auth status`
- `git diff --check`
- `npm run ci`
