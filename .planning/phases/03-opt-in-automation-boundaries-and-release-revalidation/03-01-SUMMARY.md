---
phase: 03-opt-in-automation-boundaries-and-release-revalidation
plan: "01"
subsystem: safety
tags: [hooks, rescue, safety-boundary, docs-contracts]

requires:
  - phase: 02
    provides: Stable background job lifecycle and package contract
provides:
  - Hook opt-in and disable contract
  - Write-capable rescue warning contract
  - Source-level guardrail tests for hook and rescue wording
affects: [phase-3, docs, hooks, mcp-tools, tests]

tech-stack:
  added: []
  patterns:
    - Docs contract tests for safety language
    - Runtime source assertions for dangerous permission paths
    - Hook source comments that mirror user-facing warnings

key-files:
  modified:
    - README.md
    - docs/SETUP.md
    - docs/DESIGN.md
    - hooks/review-gate.mjs
    - server.mjs
    - test/docs-rollout-contract.test.mjs
    - test/runtime-contract.test.mjs

key-decisions:
  - "Keep hook review outside default onboarding and label it advanced opt-in."
  - "Document a concrete disable checklist next to hook setup."
  - "Keep allow_write on claude_rescue outside the standard v1 review path and warn that it grants broad write permissions through --dangerously-skip-permissions."

patterns-established:
  - "Hook docs must mention opt-in setup, default-off behavior, disable path, loop risk, blocking at turn completion, and usage-cost risk."
  - "Write-capable rescue docs and source descriptions must mention claude_rescue, allow_write, outside standard v1 review path, --dangerously-skip-permissions, broad write permissions, and trusted repos."

requirements-completed: [SAFE-03, SAFE-04, SAFE-05]

duration: 12min
completed: 2026-06-10
---

# Phase 3 Plan 1: Hook And Rescue Safety Boundaries Summary

**Hook automation and write-capable rescue are now guarded by docs and source
contract tests.**

## Korean Summary

Phase 3-1에서는 v1 팀 rollout의 기본 경로가 여전히 수동 slash-command
workflow라는 점을 다시 고정했습니다. hook은 자동 리뷰처럼 보일 수 있기 때문에
기본 설치가 아니라 advanced opt-in 경로로 남겼고, 켜는 방법 옆에 disable
checklist를 같이 둬서 되돌릴 수 있는 기능으로 설명했습니다.

또한 `claude_rescue allow_write=true`는 일반 리뷰 경로가 아니라 read-only
경계를 넘는 예외라는 점을 README, SETUP, DESIGN, MCP tool description에
명시했습니다. 이 옵션은 `--dangerously-skip-permissions`를 사용해 broad write
permissions를 열 수 있으므로 trusted repo에서만 쓰도록 경고했습니다.

## Accomplishments

- Added docs contract tests for hook default-off, advanced opt-in, disable
  checklist, loop risk, blocking at turn completion, and usage-cost risk.
- Added docs contract tests for `claude_rescue allow_write=true` staying outside
  the standard v1 review path.
- Updated README/setup/design docs so hook setup and rollback are documented
  together.
- Updated `server.mjs` rescue tool description to warn about broad write
  permissions and `--dangerously-skip-permissions`.
- Updated `hooks/review-gate.mjs` header comments so source readers see the
  same opt-in, blocking, disable, and usage-cost warnings.

## Files Created/Modified

- `README.md` - Clarifies manual slash-command workflow, hook disable checklist,
  and write-capable rescue warnings.
- `docs/SETUP.md` - Adds hook rollback steps and stronger rescue warnings.
- `docs/DESIGN.md` - Captures hook/rescue product boundaries.
- `server.mjs` - Updates `claude_rescue` MCP tool description.
- `hooks/review-gate.mjs` - Mirrors hook risk and rollback language in source.
- `test/docs-rollout-contract.test.mjs` - Locks user-facing safety docs.
- `test/runtime-contract.test.mjs` - Locks source-level rescue and hook warnings.

## Deviations from Plan

No hook behavior tests were added. The plan intentionally scoped Phase 3-1 to
docs/source contracts, leaving hook allow/block/malformed/timeout execution
tests in v2.

## Verification

- `npm test` - passed after the new failing contract tests were satisfied.

## Next Plan Readiness

Ready for `03-02-PLAN.md`: release-facing docs can now add revalidation markers
without changing the product boundary.

---
*Phase: 03-opt-in-automation-boundaries-and-release-revalidation*
*Completed: 2026-06-10*
