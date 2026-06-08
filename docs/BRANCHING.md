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

Promote verified `dev` to `master` locally with a fast-forward merge:

```bash
git fetch origin
git checkout master
git pull --ff-only origin master
git merge --ff-only origin/dev
git push origin master
git checkout dev
```

This advances only `master` to the already-verified `dev` commit. It does not
delete or rewrite `dev`.

If `master` cannot fast-forward to `origin/dev`, stop and inspect the divergence
before merging. Do not force-push `master` or `dev`.

## GitHub Settings

Protect both long-lived branches:

- `master`: require CI and restrict direct changes to intentional release
  promotion.
- `dev`: require CI for feature/topic branch pull requests.

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
