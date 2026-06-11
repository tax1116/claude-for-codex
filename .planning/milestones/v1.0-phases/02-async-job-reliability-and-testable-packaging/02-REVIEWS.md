---
phase: 02
slug: async-job-reliability-and-testable-packaging
status: passed
created: 2026-06-09
reviewed: 2026-06-10T05:34:39Z
reviewers_requested: [claude]
reviewers_completed: [claude]
---

# Phase 02 - Cross-AI Reviews

## Status

The Phase 2 external Claude review blocker is cleared.

The original `$gsd-review 2` attempt was blocked because Claude Code CLI was not
logged in from the runtime context and sending non-public workspace planning,
requirements, validation, runtime, tests, and docs content to the external
Claude service required explicit user approval.

On 2026-06-10, the user explicitly approved that data export for a read-only
Phase 2 review, and the local Claude Code CLI auth status was verified outside
the sandbox.

## Reviewer Detection

| Reviewer | Detected | Used | Result |
|----------|----------|------|--------|
| Claude Code CLI | yes (`/opt/homebrew/bin/claude`) | yes | passed |
| Codex CLI | yes (`/opt/homebrew/bin/codex`) | no | skipped because current runtime is Codex |
| Cursor CLI | yes (`/opt/homebrew/bin/cursor`) | no | not selected for this phase review |
| Gemini CLI | no | no | unavailable |
| OpenCode CLI | no | no | unavailable |
| Qwen CLI | no | no | unavailable |

## Attempt Log

### Initial Claude Code CLI Attempt

Command shape:

```bash
claude -p - < /private/tmp/gsd-review-prompt-2.md
```

Result:

```text
Not logged in · Please run /login
```

A sandbox-external retry was deferred because it would send non-public workspace
planning, requirements, validation, runtime, tests, and docs content to an
external Claude service.

### Authorized Claude Code CLI Review

Preconditions:

1. User explicitly approved sending Phase 2 planning, requirements, validation,
   runtime, tests, and docs context to the external Claude service for read-only
   review.
2. `claude auth status` was verified outside the sandbox:

```json
{
  "loggedIn": true,
  "authMethod": "claude.ai",
  "apiProvider": "firstParty",
  "subscriptionType": "team"
}
```

Command shape:

```bash
claude -p "<Phase 2 read-only review prompt>" \
  --output-format json \
  --model sonnet \
  --max-turns 25 \
  --allowedTools "Read,Grep,Glob,Bash(git diff:*),Bash(git log:*),Bash(git status:*),Bash(git show:*)" \
  --disallowedTools "Edit,Write,MultiEdit,NotebookEdit"
```

Execution metadata:

| Field | Value |
|-------|-------|
| Result | success |
| Session id | `abd94a6b-662b-4312-8fd8-a8f36e4aa2b9` |
| Turns | 24 |
| Duration | 321s |
| Reported cost | `$0.94039125` |

## Review Outcome

Claude reviewed Phase 2 requirements `JOB-01..JOB-05`, `QUAL-01..QUAL-06`, and
`DOC-03` against implementation, tests, docs, and package contents.

### High

No high-confidence findings.

Claude reported that all twelve Phase 2 requirements have readable code, test,
and documentation coverage, and found no correctness, security, or requirement
gaps.

### Medium

| Finding | Disposition |
|---------|-------------|
| `resultText()` without `taskId` was not covered by tests. | Fixed after review by adding `test/job-lifecycle.test.mjs` coverage for default result selection while a newer job is still running. |
| Phase 2 verification evidence count was stale after later Phase 3 test additions. | Addressed in this review record and verification notes by recording the current suite baseline after follow-up. |

### Low

| Finding | Disposition |
|---------|-------------|
| `statusText` caps at 10 jobs while `resultText` and `cancelJob` do not. | Accepted as non-blocking; potential future cleanup. |
| `cwd` mismatch can silently read a different repo-scoped job store. | Accepted as non-blocking; potential future diagnostics enhancement. |
| Temp dirs created by tests are not cleaned up. | Accepted as non-blocking test hygiene improvement. |
| `docs/BRANCHING.md` is packaged because README links it. | Accepted as intentional for now while branch policy remains part of rollout docs. |

## Requirement Summary

| Requirement | Verdict | Evidence |
|-------------|---------|----------|
| JOB-01 | satisfied | Background runner returns a task id immediately. |
| JOB-02 | satisfied | `statusText({ cwd })` lists running and completed jobs. |
| JOB-03 | satisfied | `resultText` returns running state before completion and final output afterward. |
| JOB-04 | satisfied | `cancelJob` cancels only live jobs owned by the current MCP process. |
| JOB-05 | satisfied | Runtime/docs state process-lifetime cancellation and avoid durable queue claims. |
| QUAL-01 | satisfied | Tests use temp dirs and fake Claude; no live Claude account required. |
| QUAL-02 | satisfied | `CLAUDE_BIN` seam and fake-Claude helper cover runner behavior. |
| QUAL-03 | satisfied | Tests cover JSON, session id, cost, turns, fallback text, non-zero exit, missing binary, timeout, and default result selection. |
| QUAL-04 | satisfied | Background status, running-result, final-result, and cancel behavior are tested. |
| QUAL-05 | satisfied | `npm run ci` runs lint, syntax checks, node tests, and package dry-run. |
| QUAL-06 | satisfied | Package tests assert `package.json.files` covers server runtime imports. |
| DOC-03 | satisfied | README/setup docs include base, focus, background, status, result, and cancel examples. |

## Blocker Verdict

**CLEARED.**

The external Claude review completed after explicit user approval and local
Claude CLI auth verification. No Phase 2 blocker remains from the cross-AI
review requirement.
