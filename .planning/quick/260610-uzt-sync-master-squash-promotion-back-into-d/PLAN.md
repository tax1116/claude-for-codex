---
quick_id: 260610-uzt
status: planned
created_at: "2026-06-10T13:19:30Z"
---

# Quick Task: Sync master squash promotion back into dev

## Goal

Repair the branch-history shape after PR #15 was squash-merged into `master`.

## Scope

- Merge `origin/master` back into a `dev`-based sync branch.
- Preserve current `dev` file contents while adding the `master` promotion
  commit to `dev` ancestry.
- Document that future `dev` to `master` promotion PRs must use merge commits,
  not squash or rebase.
- Update `.planning/STATE.md` to reflect PR #15 and the sync follow-up.

## Verification

- `git diff --check`
- `npm run ci`
- GitHub CI on the sync PR
