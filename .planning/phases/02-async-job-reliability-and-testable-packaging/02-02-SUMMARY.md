---
phase: 02-async-job-reliability-and-testable-packaging
plan: "02"
subsystem: docs
tags: [docs, packaging, background-jobs, npm]

requires:
  - phase: 02-01
    provides: Testable fake-Claude lifecycle and cancellation contract
provides:
  - Background review lifecycle documentation
  - Runtime helper package coverage tests
  - Canonical state env documentation
affects: [phase-2, docs, package-contract, tests]

tech-stack:
  added: []
  patterns:
    - Docs contract tests for user-facing workflow examples
    - Package files coverage for server runtime imports

key-files:
  modified:
    - README.md
    - docs/SETUP.md
    - docs/DESIGN.md
    - test/docs-rollout-contract.test.mjs

key-decisions:
  - "Keep slash commands first while showing MCP status/result/cancel as the reference lifecycle."
  - "Document CLAUDE_FOR_CODEX_STATE as canonical and CLAUDE_FOR_CODEX_STORE/CODEX_CC_STORE as legacy read paths."
  - "State that cancellation is best effort and process-lifetime only, not a hosted durable queue."

patterns-established:
  - "Docs tests must cover base, focus, background, status, result, cancel, and cancellation boundary examples."
  - "Package tests must prove server runtime imports are covered by package.json files entries."

requirements-completed: [JOB-01, JOB-02, JOB-03, JOB-04, JOB-05, QUAL-05, QUAL-06, DOC-03]

duration: 8min
completed: 2026-06-09
---

# Phase 2 Plan 2: Package And Background Workflow Documentation Summary

**Team docs now show the full background review lifecycle and package tests protect extracted runtime helpers.**

## 한국어 작업 요약

Phase 2-2에서는 Phase 2-1에서 만든 background job 동작을 팀원이 실제로 따라 할
수 있도록 README, setup, design 문서와 package 검증을 보강했습니다. 목표는
slash command 중심의 사용 흐름을 유지하면서도 MCP tool 기준 lifecycle인
`claude_status`, `claude_result`, `claude_cancel`을 정확히 설명하는 것입니다.

주요 작업:

- README와 setup 문서에 base-ref 리뷰, focused adversarial review,
  background review, status 조회, result 조회, cancel 예시를 추가했습니다.
- cancel은 현재 MCP 서버가 Claude child process를 소유하는 동안만 가능한
  best-effort 동작이며 hosted durable queue가 아니라는 경계를 문서화했습니다.
- design 문서에 canonical state env인 `CLAUDE_FOR_CODEX_STATE`와 legacy read
  path를 정리했습니다.
- docs contract test로 `base=`, `focus=`, `background: true`,
  `claude_status`, `claude_result`, `claude_cancel`, cancellation boundary 문구가
  빠지지 않도록 고정했습니다.
- npm package dry-run에서 `src/claude-runner.mjs` 같은 runtime helper가 빠지지
  않도록 package files coverage 테스트를 추가했습니다.

검증 결과:

- `node --test test/docs-rollout-contract.test.mjs` 통과
- 문서 예시와 cancellation warning 검색 확인
- `npm run ci` 통과
- `npm pack --dry-run --cache ./.npm-cache`에서 runtime 파일 포함 확인

## Accomplishments

- Added README and setup examples for base-ref review, focused adversarial review, background review, status, result, and cancel.
- Documented cancellation as best effort and process-lifetime only while the MCP server owns the Claude child process.
- Updated design docs to describe canonical `CLAUDE_FOR_CODEX_STATE`, legacy read paths, background execution, and cancellation boundaries.
- Added docs tests for base/focus/background examples and cancellation warnings.
- Added package contract tests that ensure server runtime imports under `src/` are covered by `package.json.files`.

## Files Created/Modified

- `README.md` - Adds background lifecycle example and canonical state env.
- `docs/SETUP.md` - Adds concrete slash/MCP examples and cancellation semantics.
- `docs/DESIGN.md` - Updates job store mechanics and cancellation contract.
- `test/docs-rollout-contract.test.mjs` - Locks docs examples and package coverage for runtime imports.

## Deviations from Plan

None - plan executed as written.

## Verification

- `node --test test/docs-rollout-contract.test.mjs` - passed.
- `rg "base=|focus=|background: true|claude_status|claude_result|claude_cancel|process-lifetime|durable queue" README.md docs test src server.mjs` - found expected examples and warnings.
- `npm run ci` - passed.
- `npm pack --dry-run --cache ./.npm-cache` - passed and included `src/claude-runner.mjs`.

## Next Phase Readiness

Phase 2 implementation is ready for PR review and Phase 2 validation.

---
*Phase: 02-async-job-reliability-and-testable-packaging*
*Completed: 2026-06-09*
