# Branching Policy

This repository uses a stable integration branch and a separate release branch.

## Branch Roles

| Branch | Role | Deletion policy |
| --- | --- | --- |
| `master` | Release branch. Contains only work promoted from a verified `dev`. | Never delete. |
| `dev` | Integration branch. Feature branches merge here first. | Never delete. |
| `codex/*`, `feature/*`, or topic branches | Short-lived work branches. | Delete after merge when no longer needed. |

## Daily Development Flow

Use short-lived work branches for implementation:

```text
codex/* or feature/* -> dev
```

1. Create a work branch from the current integration baseline.
2. Open a pull request into `dev`.
3. Wait for CI to pass.
4. Merge into `dev`.
5. Delete only the merged work branch.

`dev` is the long-lived integration line and must remain available after every
feature merge.

## Release Promotion Flow

Promote verified `dev` to `master` with a pull request:

```text
dev -> master
```

1. Confirm `dev` is green and contains only work intended for release.
2. Open a pull request from `dev` into `master`.
3. Wait for required CI and review gates on `master`.
4. Merge the promotion PR.
5. Keep `dev`; do not delete the branch after the promotion PR merges.

This keeps a GitHub audit trail for release promotion while preserving `dev` as
the long-lived integration branch.

Do not push directly to `master` for normal release promotion. If GitHub shows a
branch-rule bypass warning, stop and use a `dev` -> `master` pull request
instead.

If `master` and `dev` diverge, stop and inspect both histories before opening
the promotion PR. Do not force-push `master` or `dev`.

## GitHub Settings

Protect both long-lived branches:

- `master`: require pull requests, CI, review, linear history, conversation
  resolution, and no force-pushes or deletions.
- `dev`: require pull requests and CI for feature/topic branch merges, and no
  force-pushes or deletions.

If GitHub shows a `Delete branch` button after a pull request merge, delete only
short-lived work branches. Do not delete `dev`.

If the repository enables automatic head-branch deletion, confirm protected
branches include `dev` and `master` before relying on it.

## Summary

```text
work branch -> dev -> master
```

Feature branches are disposable. `dev` is the integration line. `master` is the
release line.
