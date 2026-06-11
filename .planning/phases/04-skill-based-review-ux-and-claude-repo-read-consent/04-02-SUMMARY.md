---
phase: 04-skill-based-review-ux-and-claude-repo-read-consent
plan: "02"
subsystem: repo-read-consent
tags: [consent, safety, mcp, state, docs]

requires:
  - phase: 04-01
    provides: Codex skill workflow surface
provides:
  - Shared repo-read consent gate for live Claude launch paths
  - Repo-level consent persistence and revocation
  - Consent inspection and revoke MCP tools
  - Skill and docs copy for allow-once, repo-allow, and cancel choices
affects: [phase-4, server, state-store, runner, skills, docs, tests]

tech-stack:
  added: []
  patterns:
    - MCP handlers gate external Claude launches before process spawn
    - StateStore owns repo-scoped consent metadata
    - Explicit cancel overrides persisted repo-level consent

key-files:
  modified:
    - server.mjs
    - src/state-store.mjs
    - src/claude-runner.mjs
    - skills/claude-review/SKILL.md
    - skills/claude-adversarial/SKILL.md
    - skills/claude-rescue/SKILL.md
    - README.md
    - docs/SETUP.md
    - docs/DESIGN.md
    - test/state-store.test.mjs
    - test/job-lifecycle.test.mjs
    - test/runtime-contract.test.mjs
    - test/docs-rollout-contract.test.mjs

key-decisions:
  - "Gate review, adversarial review, and rescue in MCP handlers, not only in skills."
  - "Persist only `allow_repo`; `allow_once` launches without writing repo consent."
  - "Treat `cancel` as an explicit per-call override even when repo consent already exists."
  - "Keep repo-read consent separate from rescue `allow_write`."

patterns-established:
  - "Consent text uses the exact user-facing boundary: Claude Code may read this repo's diff, related files, and selected planning docs."
  - "Repo consent can be inspected with `claude_consent_status` and revoked with `claude_consent_revoke`."

requirements-completed: [CONSENT-01, CONSENT-02, CONSENT-03, CONSENT-04]

implementation-commit: b8fa45a
duration: 45min
completed: 2026-06-11
---

# Phase 4 Plan 2: Repo-Read Consent Gate And Shared Policy Summary

**Live Claude review, adversarial review, and rescue now require an explicit
repo-read consent path before Claude Code starts.**

## Korean Summary

Phase 4-2에서는 Claude Code가 실제로 실행되기 전에 repo-read consent를 확인하는
공통 gate를 MCP handler 레벨에 추가했습니다. 따라서 `$claude-review` 같은 skill
경로뿐 아니라 MCP tool을 직접 호출하는 경우에도 consent가 없으면 Claude process를
시작하지 않습니다.

사용자는 `allow once`, `always allow for this repository`, `cancel` 중 하나를
선택할 수 있습니다. `allow once`는 현재 요청에만 적용되고, `allow_repo`는 repo
상태 파일에 저장됩니다. `cancel`은 저장된 repo consent가 있어도 명시 선택으로
우선 적용됩니다.

또한 repo-level consent를 확인하는 `claude_consent_status`와 해제하는
`claude_consent_revoke` MCP tool을 추가했습니다. repo-read consent는 쓰기 권한이
아니며, `claude_rescue`의 `allow_write: true`는 계속 별도의 위험 경계로 유지됩니다.

## Accomplishments

- Added repo-read consent persistence to `StateStore`.
- Exposed consent state helpers through the Claude runner.
- Added `repo_read_consent` to `claude_review`, `claude_adversarial_review`,
  and `claude_rescue`.
- Added a shared MCP handler gate before `startBackground` or `runForeground`.
- Added `claude_consent_status` and `claude_consent_revoke`.
- Updated skills and docs with allow-once, repo-allow, cancel, inspect, and
  revoke guidance.
- Added source and state tests for consent gating, cancellation precedence, and
  write-boundary separation.

## Files Created/Modified

- `server.mjs`
- `src/state-store.mjs`
- `src/claude-runner.mjs`
- `skills/claude-review/SKILL.md`
- `skills/claude-adversarial/SKILL.md`
- `skills/claude-rescue/SKILL.md`
- `README.md`
- `docs/SETUP.md`
- `docs/DESIGN.md`
- `test/state-store.test.mjs`
- `test/job-lifecycle.test.mjs`
- `test/runtime-contract.test.mjs`
- `test/docs-rollout-contract.test.mjs`

## Deviations from Plan

The implementation added an explicit test that `cancel` is evaluated before
persisted repo consent. This tightens the safety behavior without changing the
planned product surface.

**Total deviations:** 1 auto-fixed. **Impact:** Safer explicit-cancel behavior.

## Verification

- `npm test` - passed with 34 tests.
- `npm run ci` - passed lint, tests, and package dry-run.
- `rg "repo_read_consent|allow_once|allow_repo|allow once|always allow for this repository|claude_consent_status|claude_consent_revoke|selected planning docs" server.mjs src test README.md docs skills` - found expected coverage.
- `rg "allow_write|dangerously-skip-permissions|broad write permissions" README.md docs server.mjs src test` - confirmed write-boundary warnings remain.
- `git diff --check` - passed.

## Self-Check: PASSED

## Next Phase Readiness

Phase 4 implementation is complete and ready for validation/review. Live Claude
review with real authentication was not run in CI and should be checked manually
when the team wants to smoke-test the installed MCP server.

---
*Phase: 04-skill-based-review-ux-and-claude-repo-read-consent*
*Completed: 2026-06-11*
