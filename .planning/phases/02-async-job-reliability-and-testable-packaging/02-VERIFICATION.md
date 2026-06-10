---
phase: 02-async-job-reliability-and-testable-packaging
verified: 2026-06-10T05:34:39Z
status: passed
score: 12/12 requirements verified
---

# Phase 2 Verification - Async Job Reliability And Testable Packaging

## Goal Achievement

**Goal:** Users can run long Claude reviews through predictable background jobs,
and maintainers can verify the job, runner, and package contract without a live
Claude account.

**Status:** Passed.

Phase 2 now has deterministic fake-Claude lifecycle tests, a testable runner
module, process-lifetime cancellation semantics, background workflow docs, and
package checks that include every runtime helper needed by npm users.

The external Claude cross-AI review blocker was cleared on 2026-06-10 after the
user explicitly approved sending Phase 2 planning, requirements, validation,
runtime, tests, and docs context to the external Claude service for read-only
review. Claude's verdict was `CLEARED` with no high-confidence findings.

## 한국어 요약

Phase 2에서는 긴 Claude 리뷰를 로컬 MCP 서버 안에서 더 예측 가능하게 다루도록
정리했습니다. 핵심은 실제 Claude 계정이나 네트워크에 의존하지 않고도
background job 흐름을 fake-Claude 테스트로 검증할 수 있게 만든 것입니다.

작업 내용:

- `server.mjs`에 섞여 있던 Claude 실행과 job lifecycle 로직을
  `src/claude-runner.mjs`로 분리했습니다.
- fake-Claude 테스트로 JSON 결과 파싱, session id 저장, 비용/turn 메타데이터,
  malformed JSON fallback, non-zero exit, missing binary, timeout, background
  status/result, cancel 흐름을 검증했습니다.
- cancel은 현재 MCP 서버 프로세스가 실제 child process를 소유하고 있을 때만
  가능한 best-effort 동작으로 제한했습니다.
- README, setup, design 문서에 `background: true`, `claude_status`,
  `claude_result`, `claude_cancel` 예시와 durable queue가 아니라는 경계를
  추가했습니다.
- npm package dry-run이 `src/claude-runner.mjs`와 `src/state-store.mjs`를
  포함하는지 테스트로 고정했습니다.
- 외부 Claude read-only 리뷰를 승인 후 실행했고, blocker verdict는
  `CLEARED`였습니다. 리뷰에서 지적한 `claude_result` without task id 테스트
  gap은 `test/job-lifecycle.test.mjs`에 추가 테스트로 보강했습니다.

검증:

- `npm run ci` 통과
- `node --test test/job-lifecycle.test.mjs` 통과
- `node --test test/docs-rollout-contract.test.mjs` 통과
- npm pack dry-run에서 runtime 파일 포함 확인

주의:

- Live Claude 인증/네트워크 호출은 의도적으로 자동 검증하지 않았습니다. Phase
  2의 목적은 로컬 lifecycle과 package contract를 deterministic하게 검증하는
  것입니다.

## Observable Truths

| Truth | Status | Evidence |
|-------|--------|----------|
| Background review can return a task id immediately and expose status/result/cancel commands. | verified | `src/claude-runner.mjs`, `test/job-lifecycle.test.mjs` |
| Status and result are repo-scoped through StateStore and can be tested with temp state roots. | verified | `src/claude-runner.mjs`, `src/state-store.mjs`, `test/job-lifecycle.test.mjs` |
| JSON output, session id, cost, turn count, malformed text fallback, non-zero exit, missing binary, and timeout behavior are deterministic under fake Claude. | verified | `test/job-lifecycle.test.mjs` |
| Cancellation is best effort while the current MCP server owns the child process and does not promise durable queue semantics. | verified | `src/claude-runner.mjs`, `README.md`, `docs/SETUP.md`, `docs/DESIGN.md`, tests |
| Package dry-run includes `server.mjs`, `src/claude-runner.mjs`, `src/state-store.mjs`, docs, prompts, hook, `LICENSE`, and `NOTICE`. | verified | `npm run ci`, `test/docs-rollout-contract.test.mjs` |

## Requirements Coverage

| Requirement | Status | Evidence |
|-------------|--------|----------|
| JOB-01 | satisfied | Background runner returns a task id and command hints immediately. |
| JOB-02 | satisfied | `statusText` lists running/recent jobs for the repo. |
| JOB-03 | satisfied | `resultText` returns final output plus Claude resume session hint. |
| JOB-04 | satisfied | `cancelJob` cancels live owned jobs and documents the process-lifetime limit. |
| JOB-05 | satisfied | Jobs and last session are persisted through `StateStore`. |
| QUAL-01 | satisfied | Fake-Claude JSON test verifies result, session id, cost, and turns. |
| QUAL-02 | satisfied | Malformed JSON text fallback is covered. |
| QUAL-03 | satisfied | Non-zero exit, missing binary, timeout guidance, and no-taskId result selection are covered. |
| QUAL-04 | satisfied | Tests use temporary repos and `CLAUDE_FOR_CODEX_STATE`, not user state. |
| QUAL-05 | satisfied | `npm run ci` runs lint, syntax checks, node tests, and pack dry-run. |
| QUAL-06 | satisfied | Package tests assert server runtime imports are covered by `package.json.files`. |
| DOC-03 | satisfied | README/setup/design docs show base, focus, background, status, result, cancel, and cancellation boundaries. |

## Anti-Patterns Found

None blocking.

## Human Verification Required

None for Phase 2 CI and package gates.

Routine CI still proves local lifecycle behavior through fake-Claude tests rather
than requiring a teammate's local auth state. A one-time live external Claude
review was executed on 2026-06-10 after explicit user approval to clear the
cross-AI review blocker.

## Verification Metadata

| Check | Result |
|-------|--------|
| `node --test test/job-lifecycle.test.mjs` | passed; 7 passed, 0 failed |
| `node --test test/docs-rollout-contract.test.mjs` | covered through `npm run ci` |
| `npm test` | passed; 26 passed, 0 failed |
| `npm run lint` | passed |
| `npm run ci` | passed; package dry-run included 15 files |
| Source assertion: lifecycle wording | passed |

## Fresh Evidence

Collected on 2026-06-09T01:38:57Z:

```text
npm run ci
tests 19
pass 19
fail 0
npm pack --dry-run --cache ./.npm-cache
total files: 15
```

```text
rg "base=|focus=|background: true|claude_status|claude_result|claude_cancel|process-lifetime|durable queue" README.md docs test src server.mjs
```

The source assertion found the expected examples and cancellation boundary
wording.

Additional evidence collected on 2026-06-10T05:34:39Z after the external Claude
review:

```text
claude -p "<Phase 2 read-only review prompt>" --output-format json --model sonnet --max-turns 25 ...
Blocker verdict: CLEARED
No high-confidence findings.
```

```text
node --test test/job-lifecycle.test.mjs
tests 7
pass 7
fail 0
```

```text
npm run ci
tests 26
pass 26
fail 0
npm pack --dry-run --cache ./.npm-cache
total files: 15
```
