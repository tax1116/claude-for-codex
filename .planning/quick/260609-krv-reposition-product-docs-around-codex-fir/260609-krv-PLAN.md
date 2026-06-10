---
quick_id: 260609-krv
status: in_progress
created: 2026-06-09
description: Reposition product docs around Codex-first replacement workflow for codex-plugin-cc
---

# Quick Task 260609-krv: Reposition Product Docs

## Goal

Make the product promise explicit: `claude-for-codex` is not another generic
review skill. It is the Codex-first replacement workflow for teams that want the
`codex-plugin-cc` idea in the opposite primary workspace.

## Tasks

1. Reframe the user-facing README and package metadata around Codex-first usage.
2. Update design/setup docs to distinguish this MCP bridge from GSD/gstack review
   workflows, PR review bots, and automatic hooks.
3. Update GSD project state artifacts so future phases inherit the clarified
   product boundary.

## Verification

- Run docs/product-positioning grep checks.
- Run `npm run ci` to ensure package/lint/test checks still pass.
