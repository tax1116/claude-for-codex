# claude-for-codex Review Workflow Design

Date: 2026-06-08
Status: Approved for planning
Owner: tax1116

## Summary

`claude-for-codex` lets Codex users call local Claude Code for read-only second-opinion reviews from inside Codex.

The first product promise is:

> Codex users can ask Claude Code for a local repo based read-only review when they need it, then ask follow-up questions about that review.

The product core is an MCP server. Slash commands are the team-facing UX wrapper. Hooks are opt-in automation. Setup/status commands are operational support.

## Goals

- Make Claude second-opinion review easy enough that teammates actually use it.
- Keep the default path manual and predictable.
- Use slash commands as the rollout surface teammates remember.
- Use MCP tools as the structured execution API Codex can call.
- Support review follow-up without depending on Claude session resume.
- Support deep review only through explicit project allowlists.
- Support team-level hook automation as opt-in, with reliable enable/disable/status.

## Implementation Tranches

### Tranche 1: Core First

The first implementation tranche is the MCP review core:

- `claude_review`
- `claude_adversarial_review`
- `claude_followup`
- shared repo state root
- review target selection
- review job schema and persistence
- fake-Claude tests
- slash prompt for `/claude-followup`

This tranche should make the core product promise work end to end:

```text
/claude-review
  -> stores a review job

/claude-followup "why is this risky?"
  -> resolves the prior review
  -> asks Claude a fresh follow-up question
  -> stores a follow-up job
```

### Deferred Until After Core First

The following work is part of the product design but not part of Tranche 1:

- `setup --enable-hook` editing `~/.codex/config.toml`
- `setup --disable-hook` editing `~/.codex/config.toml`
- Stop hook behavior changes beyond reading the shared state root
- deep review command execution
- npm or GitHub release automation

These pieces should be implemented only after the MCP review core is tested.

## What Already Exists

The repository already has a prototype surface that should be reused, not rebuilt from scratch:

- `server.mjs`: MCP server prototype with review, adversarial review, rescue, status, result, and cancel tools
- `hooks/review-gate.mjs`: Stop hook prototype that calls Claude read-only and blocks on `BLOCK:`
- `prompts/claude-review.md`: slash prompt wrapper for `claude_review`
- `prompts/claude-adversarial.md`: slash prompt wrapper for `claude_adversarial_review`
- `prompts/claude-rescue.md`: advanced rescue prompt, now outside the standard team rollout path
- `docs/SETUP.md` and `docs/DESIGN.md`: manual MCP and hook documentation that will need a Core First alignment pass after implementation

Core First should reuse this shape while extracting shared state, target selection, runner, and follow-up behavior into testable modules.

## Non-Goals

- Do not clone the Claude Code terminal UI inside Codex.
- Do not make automatic review the default install behavior.
- Do not make write-capable Claude delegation part of the primary UX.
- Do not allow arbitrary shell commands during deep review.
- Do not depend on Claude session resume for review follow-up.

## Product Surface

The standard team UX is slash command first:

- `/claude-review`
- `/claude-adversarial`
- `/claude-followup`
- `/claude-review --deep`
- `/claude-adversarial --deep`

MCP tools remain the real execution surface:

- `claude_review`
- `claude_adversarial_review`
- `claude_followup`
- `claude_setup`
- `claude_status`
- `claude_result`
- `claude_cancel`

Advanced MCP-only escape hatch:

- `claude_rescue`

`claude_rescue` stays available for advanced users, but the standard team rollout does not teach it as the main workflow. The rollout focuses on review habits.

## Architecture

### Slash Prompt Layer

Prompt files are thin wrappers that tell Codex which MCP tool to call.

- `prompts/claude-review.md`
- `prompts/claude-adversarial.md`
- `prompts/claude-followup.md`

Prompts must not own business logic. They should parse user intent into tool arguments and defer execution to the MCP server.

### MCP Server Layer

The MCP server owns:

- tool schemas
- review target selection
- permission mode
- deep review config loading
- Claude CLI invocation
- job creation and result persistence
- follow-up context selection
- status/result/cancel behavior

The MCP server is the product core. Codex should call Claude through MCP tools, not by ad hoc shell instructions in prompts.

### Review Context Store

Review, adversarial review, follow-up, and rescue jobs are stored per repo.

Each job should include:

- `id`
- `jobClass`: `review`, `followup`, or `task`
- `kind`: `review`, `adversarial-review`, `followup`, or `rescue`
- `cwd`
- `workspaceRoot`
- `status`
- `startedAt`
- `endedAt`
- `base`
- `scope`
- `deep`
- `result`
- `rendered`
- `sessionId`, if Claude provides one
- `verificationCommands`, for deep review
- `verificationResults`, for deep review

Claude session ids may be stored for observability, but review follow-up must not require `claude --resume`.

Tranche 1 must introduce a single `StateStore` boundary instead of scattering job file reads and writes through tool handlers. The state boundary owns:

- repo slug and realpath hash calculation
- state directory resolution
- job summary pruning
- per-job result file reads and writes
- latest completed review lookup
- legacy store compatibility

The implementation should keep tool handlers thin. Tool handlers call state and runner helpers; they do not hand-roll file paths.

### Setup and Hook Layer

Setup/status commands own installation and operational checks.

- `setup --status`
- `setup --enable-hook`
- `setup --disable-hook`

The Stop hook is opt-in. It is never enabled by default.

## Review Target Selection

Review target selection should follow the shape of `openai/codex-plugin-cc`:

- If a base ref is provided, review branch diff against that base.
- If the working tree has staged, unstaged, or untracked changes, review the working tree.
- If the working tree is clean, review the branch against the detected default/base branch.
- Include untracked files explicitly; do not assume `git diff` covers them.
- Provide a `scope` override for `auto`, `working-tree`, and `branch`.

This avoids the common failure mode where a first commit or generated untracked file is skipped.

## Follow-Up Flow

`/claude-followup` is not a general Claude chat mode. It is a review explanation mode.

It creates a fresh Claude call using prior review output as context.

Context priority:

1. User-provided review text
2. User-provided `task_id`
3. Latest completed `review` or `adversarial-review` job for the same repo

Tool input:

- `question`: required
- `task_id`: optional
- `review_text`: optional
- `background`: optional, defaults to foreground
- `cwd`: optional

Valid review context jobs:

- `jobClass: "review"`
- `kind: "review"` or `kind: "adversarial-review"`
- `status: "completed"`
- non-empty `result` or `rendered`

The follow-up job itself uses:

- `jobClass: "followup"`
- `kind: "followup"`
- `parentJobId`, when a stored review job is used
- `question`
- `contextSource`: `review_text`, `task_id`, or `latest_review`

Flow:

1. User runs `/claude-review` or `/claude-adversarial`.
2. The MCP server stores a completed review job.
3. User runs `/claude-followup "question"`.
4. MCP server resolves review context using the priority above.
5. MCP server calls Claude with the stored review result, the user question, and instructions to re-check current git status/diff read-only.
6. MCP server stores the follow-up as a separate job.

Rules:

- Follow-up does not use Claude session resume by default.
- Follow-up may inspect current `git status` and `git diff`.
- Follow-up must not edit files.
- If no review context exists, fail with a next action.

Core First failure modes:

| Failure | Handling | Required test |
| --- | --- | --- |
| No stored review exists | Return the next-action message below | `claude_followup` with empty state |
| `task_id` points to a non-review job | Reject it and ask for a review task id | `claude_followup` with rescue job id |
| Latest review job is still running | Tell the user to check status/result first | `claude_followup` with running review job |
| Review result file is missing or corrupt | Mark the context unusable and ask for a fresh review | corrupt job file fixture |
| Working tree changed since review | Include current `git status`/diff recheck in the follow-up prompt | fake-Claude argv/prompt assertion |

Failure message:

```text
No Claude review result found for this repo.

Run /claude-review first, or pass a review task id:
  /claude-followup --task task-abc123 "why is this risky?"
```

## Deep Review

Deep review expands read-only review with explicitly allowed verification commands.

It never allows file edits.

Project config file:

```json
{
  "deepReview": {
    "commands": [
      "npm run lint",
      "npm run typecheck",
      "npm test"
    ]
  }
}
```

Recommended filename:

```text
.claude-for-codex.json
```

Behavior:

- `setup --status` may detect candidate commands from `package.json`.
- Only commands listed in `.claude-for-codex.json` are executable in deep review.
- If `--deep` is requested and no commands are configured, downgrade to normal read-only review and say deep checks were skipped.
- If an allowed command fails, the plugin should not hide it or treat the plugin call as unusable.
- Failed verification output becomes review evidence.
- Claude may reason over command output, but may not choose arbitrary commands.

## Permissions

Default review:

- allowed: file reads, glob/grep/search, `git status`, `git diff`, `git log`, `git show`
- disallowed: file writes and edits

Deep review:

- default review permissions
- plus exact configured verification commands
- still disallows writes

Follow-up:

- default review permissions
- no writes

Hook:

- quick read-only review
- no deep commands
- no writes

Rescue:

- advanced MCP-only escape hatch
- read-only by default
- write mode requires explicit opt-in

## State Root

Setup, MCP server, and hook must read and write the same state root.

Default:

```text
~/.claude-for-codex/state
```

Override:

```text
CLAUDE_FOR_CODEX_STATE
```

Legacy compatibility:

```text
CLAUDE_FOR_CODEX_STORE
CODEX_CC_STORE
```

`CLAUDE_FOR_CODEX_STATE` is the new canonical state root. Existing prototype users may already have jobs under `CLAUDE_FOR_CODEX_STORE` or `~/.claude-for-codex/jobs`. Tranche 1 should read old job locations for `status`, `result`, and `followup` lookup, while writing new jobs to the canonical state root.

Repo state dir:

```text
~/.claude-for-codex/state/<repo-slug>-<repo-realpath-hash>/
```

Contents:

```text
state.json
jobs/
logs/
```

Example `state.json`:

```json
{
  "version": 1,
  "config": {
    "stopReviewGate": false,
    "deepReview": {
      "commands": []
    }
  },
  "jobs": []
}
```

Important constraint:

- Do not write setup state to a temp fallback while hooks read persistent plugin data.
- `setup --status` must report the state root.
- Hook enablement must consider both plugin state and Codex hook config.

This directly avoids the upstream class of bug where setup and hook read different state directories.

## Setup and Status

`setup --status` checks:

- Node version
- Claude Code CLI availability
- Claude Code version
- MCP config snippet or registration status
- slash prompt installation
- hook config presence
- hook state flag
- state root path
- deep review allowlist
- latest review job

`setup --enable-hook`:

- sets `stopReviewGate` to `true` in the shared state root
- installs a plugin-owned Codex Stop hook block in `~/.codex/config.toml`
- creates a backup before editing Codex config
- only edits content inside this plugin's managed block
- verifies status after enabling

`setup --disable-hook`:

- sets `stopReviewGate` to `false` in the shared state root
- removes or disables only this plugin's managed Stop hook block
- leaves MCP server and slash prompts installed

Snippet-only output should be available as an explicit dry-run or print mode, not as the default behavior of `setup --enable-hook`.

If config and state disagree, `setup --status` should say so:

```text
Hook config and plugin state disagree.

Config: installed
State: disabled

Run one:
  setup --enable-hook
  setup --disable-hook
```

## Hook Gate

The Stop hook behavior:

1. Read Codex event JSON from stdin.
2. Resolve `cwd`.
3. Resolve repo state dir.
4. Read `state.json.config.stopReviewGate`.
5. If false, exit 0.
6. If true, run a quick read-only Claude review.
7. If Claude returns `BLOCK: <reason>`, write one sentence to stderr and exit 2.
8. Otherwise exit 0.

The hook must not run deep review. It must not print a long report. It should return a short blocking reason that Codex can act on.

## Error Handling

Errors must end with the next useful action.

Claude missing:

```text
Claude Code CLI was not found.

Install it:
  npm install -g @anthropic-ai/claude-code

Then run:
  claude
```

Claude auth failure:

```text
Claude Code is installed but not authenticated.

Run:
  claude

Then retry /claude-review.
```

No review target:

```text
No review target found.

Use one of:
  /claude-review --base main
  /claude-review --scope working-tree
```

Deep review not configured:

```text
Deep review is not configured for this repo.

Continuing with normal read-only review.
```

Background job still running:

```text
Job task-abc123 is still running.

Use:
  /claude-status task-abc123
  /claude-result task-abc123
```

Hook block:

```text
Claude review gate: <one sentence reason>
```

## Upstream Alignment

This design follows the product shape of `openai/codex-plugin-cc` while reversing direction:

- slash command UX first
- local CLI auth/runtime reuse
- status/result/cancel around tracked jobs
- review target auto-selection
- untracked file collection
- rescue/task resume separate from review
- Stop hook gate as opt-in setup behavior

Key divergence:

- This plugin uses MCP as the product core because Codex needs a structured way to call Claude.
- Review follow-up is a fresh call over stored review output, not a Claude session resume.
- Deep review command execution is allowlist-based.

References:

- https://github.com/openai/codex-plugin-cc
- https://github.com/openai/codex-plugin-cc/blob/main/README.md
- https://github.com/openai/codex-plugin-cc/blob/main/plugins/codex/scripts/codex-companion.mjs
- https://github.com/openai/codex-plugin-cc/issues/59

## Testing Plan

Tranche 1 should use Node's built-in `node:test` runner unless the implementation introduces a stronger reason to add a test dependency. This keeps the first rollout small and avoids spending an extra dependency decision on basic CLI and state tests.

Unit tests:

- review target selection
- repo state dir calculation
- legacy store compatibility
- job store read/write/list
- latest review job selection
- follow-up context priority
- follow-up job creation
- deep review config parsing
- allowed command matching
- setup enable/disable state mutation
- hook state lookup

Tranche 1 required unit tests:

- review target selection
- repo state dir calculation
- legacy store compatibility
- job store read/write/list
- latest review job selection
- follow-up context priority
- follow-up job creation

Post-Core tests:

- deep review config parsing
- allowed command matching
- setup enable/disable state mutation
- hook state lookup

Integration tests use a fake `claude` binary:

- record argv
- emit Claude-style JSON
- simulate auth failure
- simulate non-zero command output
- simulate `BLOCK:` hook output

Tranche 1 fake-Claude tests:

- `claude_review` records a completed review job
- `claude_adversarial_review` records a completed adversarial review job
- `claude_followup` uses explicit `review_text`
- `claude_followup` uses explicit `task_id`
- `claude_followup` falls back to the latest completed review job
- `claude_followup` fails with a next action when no review context exists

MCP smoke tests:

- server exposes expected tool names
- `claude_setup` returns readiness
- fake `claude_review` stores a review job
- fake `claude_followup` reads latest review job
- `claude_status`, `claude_result`, and `claude_cancel` operate on jobs

Manual acceptance:

1. `/claude-review`
2. `/claude-followup "explain the high issue"`
3. `/claude-adversarial --deep auth and data loss`
4. `/claude-status`
5. `/claude-result`
6. `setup --enable-hook`
7. simulated blocking Stop hook
8. `setup --disable-hook`
9. verify the hook no longer runs

## Implementation Defaults

- Implement Tranche 1 as Core First before hook/setup automation.
- Convert the MCP server body to TypeScript before the team rollout work begins.
- Keep tiny hook scripts in ESM JavaScript unless TypeScript clearly simplifies them.
- `setup --enable-hook` and `setup --disable-hook` mutate `~/.codex/config.toml` through a plugin-owned managed block and create a backup before edits.
- Provide an explicit print/dry-run mode for users who want to apply config manually.
- Use `.claude-for-codex.json` as the repo-local config file.
- Use `deepReview.commands` as the v1 allowlist schema.
- Store full job output in per-job files, but keep the state summary pruned to the latest 50 jobs per repo.
- `claude_followup` supports `background` in v1, but defaults to foreground.

## Approved Decisions

- Product promise: manual Claude review from Codex, plus review follow-up.
- Product core: MCP server.
- Team UX: slash command centered, MCP tool capable.
- Follow-up: stored review result plus current git read-only recheck.
- Deep review: explicit allowlist only.
- Rescue: MCP-only advanced escape hatch for now.
- Hook: first-class team opt-in, never default.
- Engineering review scope: Core First before docs/setup/hook automation.
