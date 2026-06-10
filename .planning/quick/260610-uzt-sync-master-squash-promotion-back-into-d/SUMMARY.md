---
quick_id: 260610-uzt
status: complete
completed_at: "2026-06-10T13:19:30Z"
---

# Summary

Prepared a `master` to `dev` sync after PR #15 was squash-merged into
`master`.

## Changed

- Merged `origin/master` into the sync branch to bring the PR #15 promotion
  commit into `dev` ancestry.
- Documented that `dev` to `master` promotion PRs must use merge commits, not
  squash or rebase.
- Added recovery guidance for accidental squash-merged promotion PRs.
- Updated `.planning/STATE.md` with the PR #15 merge and sync follow-up.

## Verification

- `git diff --check`
- `npm run ci`
