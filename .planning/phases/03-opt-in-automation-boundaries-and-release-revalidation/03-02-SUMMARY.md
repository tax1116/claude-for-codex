---
phase: 03-opt-in-automation-boundaries-and-release-revalidation
plan: "02"
subsystem: release-docs
tags: [release, revalidation, publishing, branch-policy]

requires:
  - phase: 03-01
    provides: Guarded hook and rescue safety boundaries
provides:
  - Release-date revalidation checklist
  - Publishing policy aligned with dev-to-master PR promotion
  - Docs contract tests for drift-prone external claims
affects: [phase-3, docs, publishing, tests]

tech-stack:
  added: []
  patterns:
    - Release-facing docs mark external-tool claims for release-date revalidation
    - Publishing docs distinguish initial repo bootstrap from ongoing release promotion
    - Docs tests cover release-sensitive categories without asserting current external behavior

key-files:
  modified:
    - README.md
    - docs/SETUP.md
    - docs/DESIGN.md
    - docs/PUBLISHING.md
    - test/docs-rollout-contract.test.mjs

key-decisions:
  - "Do not claim current Codex/Claude external behavior unless official docs are checked during release work."
  - "Use docs checklists, not automation, for v1 release-date revalidation."
  - "Keep ongoing release promotion on PR-based dev to master flow and do not delete dev."

patterns-established:
  - "Release-date revalidation must cover Codex CLI/MCP config, hook behavior, Claude Code CLI behavior, model aliases, billing/Agent SDK usage, and npm package setup."
  - "Publishing docs must mention dev, master, PR promotion, CI, branch protection, and not deleting dev."

requirements-completed: [DOC-05]

duration: 10min
completed: 2026-06-10
---

# Phase 3 Plan 2: Release Revalidation Markers Summary

**Release-facing docs now identify drift-prone external claims before they can
be treated as current.**

## Korean Summary

Phase 3-2에서는 Codex CLI/MCP 설정, hook 동작, Claude Code CLI 동작, model
alias, billing/Agent SDK usage, npm package setup처럼 시간이 지나면 바뀔 수
있는 항목을 release-date revalidation 대상으로 문서화했습니다.

중요한 점은 이번 작업이 외부 공식 문서를 "현재 확인했다"고 주장하지 않는다는
것입니다. 대신 팀 rollout, npm publish, release tag 전에 official docs와 local
smoke check로 다시 확인해야 하는 항목을 README, SETUP, DESIGN, PUBLISHING에
명시했습니다.

또한 `docs/PUBLISHING.md`를 현재 저장소 정책에 맞춰 정리했습니다. 처음 GitHub
repo를 만드는 bootstrap 명령은 별도 섹션으로 두고, 실제 ongoing release는
`dev` to `master` PR promotion, CI, branch protection, review gate를 통과한 뒤
merge하며 `dev`는 삭제하지 않는 정책으로 설명했습니다.

## Accomplishments

- Added release-date revalidation sections to README and setup docs.
- Added design caveat requiring official-doc checks before release-facing docs
  claim current external behavior.
- Updated publishing docs to distinguish initial bootstrap from ongoing release
  promotion.
- Added publishing guidance for `dev` to `master` PR promotion, CI, branch
  protection, and preserving `dev`.
- Added docs contract tests for all release-sensitive categories.

## Files Created/Modified

- `README.md` - Adds release-date revalidation table.
- `docs/SETUP.md` - Adds setup-focused release-date revalidation checklist.
- `docs/DESIGN.md` - Adds design caveat for external behavior drift.
- `docs/PUBLISHING.md` - Adds ongoing release promotion and revalidation
  guidance.
- `test/docs-rollout-contract.test.mjs` - Locks release revalidation and
  publishing policy language.

## Deviations from Plan

No live official-doc revalidation was performed during implementation. That was
intentional: this plan adds release markers and checklists so the release owner
can perform date-specific verification before publishing or team rollout.

## Verification

- `npm test` - passed after revalidation and publishing contract tests were
  satisfied.

## Next Phase Readiness

Phase 3 implementation is ready for full verification and PR review. The Phase 2
external Claude review blocker remains recorded separately and was not cleared
by this docs implementation.

---
*Phase: 03-opt-in-automation-boundaries-and-release-revalidation*
*Completed: 2026-06-10*
