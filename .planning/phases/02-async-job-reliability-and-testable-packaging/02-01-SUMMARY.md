---
phase: 02-async-job-reliability-and-testable-packaging
plan: "01"
subsystem: runtime
tags: [mcp, claude-code, async-jobs, fake-claude, tests]

requires:
  - phase: 01
    provides: Manual read-only review runtime and setup diagnostics
provides:
  - Testable Claude runner module
  - Fake-Claude lifecycle coverage
  - Process-lifetime cancellation contract
affects: [phase-2, runtime, state-store, tests]

tech-stack:
  added: []
  patterns:
    - ESM runtime helper extracted under src/
    - Node built-in test runner with temporary fake Claude executable
    - Repo-scoped temporary StateStore roots for lifecycle tests

key-files:
  created:
    - src/claude-runner.mjs
    - test/job-lifecycle.test.mjs
  modified:
    - server.mjs
    - package.json
    - test/runtime-contract.test.mjs

key-decisions:
  - "Keep server.mjs as the MCP stdio entrypoint and move only runner/job lifecycle helpers into src/claude-runner.mjs."
  - "Use fake-Claude tests instead of live Claude so CI does not require auth, network, or usage credits."
  - "Limit cancellation to the current MCP process's live child map instead of killing persisted stale pids."

patterns-established:
  - "Tests can inject CLAUDE_BIN, CLAUDE_FOR_CODEX_STATE, and CLAUDE_TIMEOUT_MS through createClaudeRunner()."
  - "Background lifecycle tests assert status/result/cancel behavior without importing the MCP server entrypoint."
  - "Cancellation wording must say best effort, process-lifetime only, and not a durable queue cancellation."

requirements-completed: [JOB-01, JOB-02, JOB-03, JOB-04, JOB-05, QUAL-01, QUAL-02, QUAL-03, QUAL-04]

duration: 15min
completed: 2026-06-09
---

# Phase 2 Plan 1: Fake-Claude Job Lifecycle Contracts Summary

**Background job behavior is now testable without a live Claude account.**

## 한국어 작업 요약

Phase 2-1에서는 Claude Code 실행과 job lifecycle 로직을 MCP 서버
엔트리포인트에서 분리해 테스트 가능한 runtime helper로 정리했습니다. 핵심은
실제 Claude 계정, 네트워크, 사용량 크레딧 없이도 긴 리뷰 작업의 성공, 실패,
timeout, background 실행, status/result 조회, cancel 동작을 로컬 테스트로
검증할 수 있게 만든 것입니다.

주요 작업:

- `server.mjs`에 섞여 있던 Claude runner와 job formatting 로직을
  `src/claude-runner.mjs`로 옮겼습니다.
- `server.mjs`는 MCP tool 등록과 prompt 구성 책임을 유지하고, 실행 lifecycle은
  `createClaudeRunner()`에 위임하도록 정리했습니다.
- fake-Claude 테스트로 JSON 결과 파싱, session id 저장, 비용/turn 메타데이터,
  malformed JSON fallback, non-zero exit, missing binary, timeout, background
  status/result, cancel 흐름을 검증했습니다.
- cancel은 현재 MCP 서버 프로세스가 실제 Claude child process를 소유하고 있을
  때만 가능한 best-effort 동작으로 제한했습니다.
- runtime 출력에도 `process-lifetime` 범위와 durable queue가 아니라는 점을
  명확히 남겼습니다.

검증 결과:

- `node --test test/job-lifecycle.test.mjs` 통과
- `npm test` 통과
- `npm run lint` 통과
- `npm run ci` 통과

## Accomplishments

- Extracted the runner/job lifecycle code from `server.mjs` into `src/claude-runner.mjs`.
- Kept MCP tool names and schemas in `server.mjs` while delegating status, result, cancel, foreground, and background execution to the runner.
- Added fake-Claude tests for successful JSON parsing, session id persistence, cost/turn metadata, malformed JSON text fallback, non-zero exits, missing binary guidance, timeout behavior, background status/result, and cancellation.
- Tightened cancellation behavior so only the MCP server process that owns the live child can cancel it.
- Added process-lifetime and non-durable-queue cancellation wording to runtime output.

## Files Created/Modified

- `src/claude-runner.mjs` - Testable runner, job formatting, status/result/cancel helpers, failure guidance, and StateStore boundary usage.
- `test/job-lifecycle.test.mjs` - Fake-Claude lifecycle tests using temp repos and temp state roots.
- `server.mjs` - Keeps MCP registration and prompt construction, delegates lifecycle behavior to `createClaudeRunner()`.
- `package.json` - Syntax check now covers `src/claude-runner.mjs`.
- `test/runtime-contract.test.mjs` - Runtime source assertions include the extracted runner module.

## Deviations from Plan

- No separate package dependency or TypeScript build was added.
- Cancellation no longer attempts to kill a persisted pid when the live child is not owned by the current MCP process. This is safer and matches the documented process-lifetime contract.

## Verification

- `node --test test/job-lifecycle.test.mjs` - passed.
- `npm test` - passed.
- `npm run lint` - passed.
- `npm run ci` - passed.

## Next Plan Readiness

Ready for `02-02-PLAN.md`: docs and package tests can now describe and lock the runner behavior that exists.

---
*Phase: 02-async-job-reliability-and-testable-packaging*
*Completed: 2026-06-09*
