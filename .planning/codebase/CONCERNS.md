# Codebase Map: Concerns

Date: 2026-06-08

## 1. `server.mjs` Is Carrying Too Many Responsibilities

The current server file contains configuration, persistence, process execution,
prompt construction, tool schemas, and tool handlers.

Risk:

- Feature work can become harder to review.
- State semantics can drift between tools.
- Tests are hard to write without spawning the real Claude CLI.

Preferred direction:

- Extract state/job-store logic first.
- Then extract Claude invocation behind an injectable runner.
- Keep MCP handlers as thin orchestration code.

## 2. Core Follow-Up Workflow Is Incomplete

The current tool surface includes review, adversarial review, rescue, status,
result, cancel, and setup.

There is not yet a `claude_followup` tool, even though follow-up against a
previous Claude session is a natural continuation of the background/result
workflow.

Risk:

- Users may overuse `claude_rescue resume:true` for conversational follow-up.
- The product contract around session continuation remains implicit.

## 3. Job Status Names Are Prototype-Oriented

Current terminal success status is `done`.

Risk:

- If future docs or APIs use `completed`, old job files and new code may diverge.
- Tool output may become harder to script against.

Preferred direction:

- Decide whether status values are internal only or part of the user contract.
- If changing status values, support migration or compatibility formatting.

## 4. Token And Context Exhaustion Are Not Managed

The server forwards prompts to Claude and relies on Claude Code behavior for
context handling.

Risk:

- Large diffs can exceed practical context or usage limits.
- Background jobs may fail late with limited structured diagnosis.
- Users may not know whether to split work, narrow a base ref, or use a focused
  adversarial review.

Preferred direction:

- Detect very large diffs before invoking Claude when possible.
- Add clearer guidance in tool results for context-limit failures.
- Keep `focus` and `base` parameters prominent in docs.

## 5. `allow_write` Is A Sharp Edge

`claude_rescue allow_write:true` passes `--dangerously-skip-permissions`.

Risk:

- Claude can edit files without the normal read-only MCP boundary.
- The option may be used casually if docs do not keep warning language nearby.

Preferred direction:

- Keep `allow_write` default false.
- Keep warning text in README, setup docs, and tool description.
- Consider additional confirmation or environment guard before enabling writes.

## 6. Hook Automation Can Loop Or Burn Usage

The `Stop` hook can block Codex and cause repeated Codex-to-Claude review
iterations.

Risk:

- Usage limits can drain quickly.
- A noisy or flaky Claude verdict can interrupt normal Codex work.
- Team members may enable hooks without understanding the cost.

Preferred direction:

- Keep hooks opt-in.
- Keep slash command / MCP manual review as the rollout default.
- Add a shared config story only after the manual workflow is stable.

## 7. Hook And MCP Config Can Drift

The hook has its own Claude invocation logic and does not reuse `server.mjs`.

Risk:

- Tool allowlists, model selection, timeout behavior, and prompt policy can
  diverge.
- Users may update MCP env but forget the hook path or hook env.

Preferred direction:

- Either keep the hook intentionally small and duplicated, or extract shared
  config constants once the core modules exist.
- Avoid coupling hook execution to a long-running MCP process.

## 8. Cancellation Is Process-Lifetime Bound

Persisted jobs survive MCP process restart, but `live` child-process handles do
not.

Risk:

- `claude_cancel` may not reliably cancel a background job after the server
  process restarts.
- Persisted `running` records can become stale.

Preferred direction:

- Store enough process metadata to detect stale jobs.
- Mark abandoned jobs clearly.
- Avoid promising durable queue semantics unless implemented.

## 9. Tests Do Not Yet Prove Behavior

Current tests are syntax checks plus lint/package verification.

Risk:

- Job-store regressions, hook exit-code issues, and prompt construction changes
  can pass CI.
- Future refactors can change behavior without a failing test.

Preferred direction:

- Add `node:test` coverage around state-store behavior first.
- Add fake-Claude integration tests before changing runner semantics.
- Keep `npm pack --dry-run` in CI.

## 10. Package File List Can Omit New Runtime Code

`package.json` uses an explicit `files` allowlist.

Risk:

- A new runtime directory can work locally but be missing from the published
  package.

Preferred direction:

- Update `files` whenever adding runtime directories.
- Keep `npm run pack:check` mandatory in CI.
- Inspect dry-run output before release.

## 11. Billing Note Is Time-Sensitive

README and design docs mention mid-2026 Claude Code / Agent SDK billing behavior.

Risk:

- Billing behavior may change outside this repository.
- The docs can become stale and mislead users.

Preferred direction:

- Treat billing docs as advisory.
- Link or refer users to current Claude Code docs before publication.
- Re-check this note during release prep.

## 12. Untracked File Review Relies On Prompt Compliance

The review prompt tells Claude to inspect untracked files shown by `git status`.

Risk:

- Claude may miss untracked files if the prompt is not followed precisely.
- There is no precomputed file list passed as structured input.

Preferred direction:

- Keep prompt language explicit for now.
- Later, compute status in the server and pass a concise structured file list to
  Claude for review.
