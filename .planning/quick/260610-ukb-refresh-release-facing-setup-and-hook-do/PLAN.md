---
quick_id: 260610-ukb
slug: refresh-release-facing-setup-and-hook-do
created: 2026-06-10T13:01:32Z
status: planned
---

# Quick Task: Refresh release-facing setup and hook documentation

## Goal

Update release-facing setup, hook, and publishing documentation after `dev` was
promoted to `master`, so the repo no longer ships stale external-tool claims.

## Scope

- Revalidate Codex CLI/MCP/hook claims against official Codex docs and local
  CLI behavior.
- Revalidate Claude Code CLI/auth/model/cost claims against official Claude
  Code docs and local CLI behavior.
- Update README, setup, design, publishing, hook comments, and doc contract
  tests where wording is now stale.
- Update `.planning/STATE.md` so it reflects the completed master promotion and
  this release-documentation refresh.

## Verification

- `git diff --check`
- `npm run ci`
- Targeted grep for stale hook/install wording
