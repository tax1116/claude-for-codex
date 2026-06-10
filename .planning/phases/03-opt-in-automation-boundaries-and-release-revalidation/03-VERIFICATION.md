---
phase: 03-opt-in-automation-boundaries-and-release-revalidation
verified: 2026-06-10T05:12:48Z
status: passed
score: 4/4 requirements covered by local tests and docs
---

# Phase 3 Verification - Opt-In Automation Boundaries And Release Revalidation

## Goal Achievement

**Goal:** Users can trust that advanced automation and write-capable rescue stay
explicit, reversible, and outside the default v1 review path.

**Status:** Passed.

Phase 3 now has docs/source contract tests that guard hook automation,
write-capable rescue, release-date revalidation markers, and the current
`dev` to `master` PR promotion policy.

## Korean Summary

Phase 3에서는 자동화와 write 권한이 기본 흐름처럼 보이지 않게 하는 안전 경계를
마무리했습니다.

검증된 내용:

- 기본 팀 onboarding은 manual slash-command workflow입니다.
- Codex Stop hook은 not part of the default install이며 advanced opt-in입니다.
- hook 문서에는 disable checklist, loop risk, blocking at turn completion,
  usage-cost risk가 있습니다.
- `claude_rescue allow_write=true`는 outside the standard v1 review path이며
  `--dangerously-skip-permissions`와 broad write permissions 경고가 있습니다.
- release-facing docs에는 release-date revalidation checklist가 있으며 Codex
  CLI/MCP config, hook behavior, Claude Code CLI behavior, model aliases,
  billing/Agent SDK usage, npm package setup을 다시 확인하도록 되어 있습니다.
- publishing docs는 `dev` to `master` PR promotion, CI, branch protection, and
  do not delete `dev` 정책을 설명합니다.

## Observable Truths

| Truth | Status | Evidence |
|-------|--------|----------|
| Hook review is not default onboarding. | verified | README, docs/SETUP.md, docs/DESIGN.md, `test/docs-rollout-contract.test.mjs` |
| Hook setup is reversible and documents disable paths. | verified | README, docs/SETUP.md, docs/DESIGN.md, hooks/review-gate.mjs |
| Hook risk language covers loops, completion blocking, and usage cost. | verified | README, docs/SETUP.md, docs/DESIGN.md, hooks/review-gate.mjs |
| Write-capable rescue is warned as outside the standard v1 review path. | verified | README, docs/SETUP.md, docs/DESIGN.md, server.mjs |
| Release-sensitive external claims are marked for release-date revalidation. | verified | README, docs/SETUP.md, docs/DESIGN.md, docs/PUBLISHING.md |
| Publishing docs align with PR-based `dev` to `master` promotion. | verified | docs/PUBLISHING.md, docs/BRANCHING.md |

## Requirements Coverage

| Requirement | Status | Evidence |
|-------------|--------|----------|
| SAFE-03 | satisfied | Rescue docs and MCP description warn about `allow_write`, `--dangerously-skip-permissions`, broad write permissions, and trusted repos. |
| SAFE-04 | satisfied | Hook docs say the gate is not part of default install, advanced opt-in, and reversible. |
| SAFE-05 | satisfied | Hook docs warn about loop, blocking at turn completion, and usage-cost risk. |
| DOC-05 | satisfied | Release-date revalidation checklists cover CLI/config, hooks, Claude CLI, model aliases, billing/Agent SDK usage, and npm package setup. |

## Human Verification Required

Release-date revalidation still requires a release owner to check official Codex
and Claude Code docs at release time. This implementation adds the checklist and
guards against stale claims; it does not claim that external docs were checked
for the current date.

The Phase 2 external Claude review blocker also remains recorded until Claude
CLI login and explicit external data-export approval are available.

## Verification Metadata

| Check | Result |
|-------|--------|
| `npm test` | passed; 25 passed, 0 failed |
| `npm run ci` | passed; lint, syntax checks, node tests, and package dry-run passed |
| Hook/rescue source assertions | passed through `npm test` |
| Release docs contract assertions | passed through `npm test` |

## Fresh Evidence

Collected on 2026-06-10T05:12:48Z:

```text
npm test
tests 25
pass 25
fail 0
```

```text
npm run ci
tests 25
pass 25
fail 0
npm pack --dry-run --cache ./.npm-cache
total files: 15
```

```text
rg "allow_write|dangerously-skip-permissions|advanced opt-in|Disable checklist|loop|blocking at turn completion|usage-cost" README.md docs hooks server.mjs src test
rg "Release-date revalidation|Codex CLI/MCP config|hook behavior|Claude Code CLI behavior|model aliases|billing/Agent SDK usage|npm package setup|dev|master|branch protection" README.md docs test .planning
git diff --check
```

The targeted searches found the expected safety and release-policy coverage, and
`git diff --check` reported no whitespace errors.
