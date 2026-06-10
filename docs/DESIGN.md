# Design & product boundary

`claude-for-codex` is the Codex-first counterpart to
[`openai/codex-plugin-cc`](https://github.com/openai/codex-plugin-cc).
`codex-plugin-cc` makes sense when Claude Code is the primary workspace and
Codex is the outside reviewer. This project makes sense when Codex is the
primary workspace and Claude Code is the outside reviewer.

The product is a local model bridge, not another review framework. It exists so
Codex users can keep working in Codex while deliberately calling Claude Code for
manual review, adversarial critique, rescue, and long-running job follow-up.
It is unofficial.

## Product boundary

This plugin should replace a Codex-first team's need to use `codex-plugin-cc`
just to get Claude Code's second opinion. It should not replace:

- GSD/gstack planning, validation, review, or shipping workflows.
- GitHub PR review bots such as CodeRabbit.
- Codex's own planning and implementation judgment.
- Manual human review for consequential changes.
- The user's responsibility to choose what context Claude sees.

Hooks remain optional because automatic lifecycle review is a different product
shape. The standard workflow is manual slash command or MCP tool invocation.

## How each codex-plugin-cc feature maps

| codex-plugin-cc (CC -> Codex) | This plugin (Codex -> CC) | Mechanism |
| --- | --- | --- |
| `/codex:review` | `claude_review` | MCP tool |
| `/codex:adversarial-review` | `claude_adversarial_review` | MCP tool (takes `focus`) |
| `/codex:rescue` | `claude_rescue` | MCP tool (`resume`/`fresh`/`model`/`allow_write`) |
| `/codex:status` | `claude_status` | MCP tool + file-backed job store |
| `/codex:result` | `claude_result` | MCP tool (+ Claude session id) |
| `/codex:cancel` | `claude_cancel` | MCP tool |
| `/codex:setup` | `claude_setup` | MCP tool |
| `--background` / `--wait` | `background: true` | tracked job + status/result |
| Review gate (`Stop` hook) | `hooks/review-gate.mjs` | Codex `Stop` hook (exit 2 = block) |
| `/codex:*` slash commands | `prompts/claude-*.md` | Codex custom prompts |

Not 1:1: Claude-Code-only UI surfaces such as the `/agents` subagent list. The
Codex-first workflow behavior is covered by the tools above.

## Mechanics

- **Runtime.** The MCP server is Node.js. This keeps the plugin close to
  `codex-plugin-cc`, matches the MCP SDK ecosystem, and gives teammates a simple
  `npm install` path. The v1 runtime is the current ESM JavaScript server
  (`server.mjs`); a TypeScript migration is deferred until module boundaries
  and package strategy justify a build step.
- **MCP transport.** The server speaks stdio JSON-RPC and is launched by Codex via
  `[mcp_servers.claude]` in `config.toml`. Each tool ultimately shells out to
  `claude -p ... --output-format json` and parses the structured result.
- **Job store.** Background jobs are persisted as JSON under the canonical
  `CLAUDE_FOR_CODEX_STATE` root, keyed by repo slug plus realpath hash so
  `status`/`result` are scoped per repo. `CLAUDE_FOR_CODEX_STORE`,
  `CODEX_CC_STORE`, and the old default jobs directory remain legacy read paths.
  The latest Claude `session_id` is remembered to support `resume: true`.
- **Background execution.** A background tool spawns the child, writes a `running` record,
  returns a task id immediately, then updates the record (result, session id, cost, exit
  code) when the child closes. Jobs live for the MCP server process lifetime.
- **Cancellation.** `claude_cancel` is best effort and process-lifetime only:
  it can cancel a running job while the current MCP server owns the Claude child
  process. It must not promise hosted durable queue semantics.
- **Review gate contract.** The `Stop` hook reads the event JSON on stdin, runs a quick
  read-only Claude review, and exits `2` with a reason on stderr to block, or `0` to allow.
  The hook asks Claude to inspect status, tracked diffs, and untracked files so first-commit
  or newly generated files are not silently skipped. The review gate is optional and disabled
  by default. It is an advanced opt-in path, not part of the default install.

## Explicit context contract

Claude does not receive the full Codex chat automatically. The explicit context
contract for `/claude-review`, `/claude-adversarial`, `claude_review`, and
`claude_adversarial_review` is:

- Prompt text from the slash command or MCP tool call.
- Read-only repository access through `Read`, `Grep`, and `Glob`.
- Read-style git state, starting with `git status --short --branch`, plus
  tracked diffs and relevant untracked files.
- Selected planning docs when present: `.planning/PROJECT.md`,
  `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, and the current phase
  `CONTEXT.md`.
- Optional `base` and `focus` values supplied by the user.
- Resumed Claude output only when a Claude session is explicitly resumed.

`resume` means Claude Code session continuity only. It does not mean Codex chat
history, hidden state, or every `.planning/**` file is sent to Claude.

## Review mode boundaries

The standard team path is manual slash commands first:

- `/claude-review` calls `claude_review` for implementation-risk review:
  missing tests, state edge cases, cancellation/resume behavior, context limits,
  and failure modes.
- `/claude-adversarial` calls `claude_adversarial_review` for adversarial design
  critique: architecture boundaries, complexity, assumptions, tradeoffs, and
  simpler alternatives.

Both review modes are read-only. They should return concrete `High`, `Medium`,
and `Low` findings, or `No high-confidence findings` when clean, and should
state that no files were edited.

`claude_rescue` and `allow_write` are outside the standard v1 review path. They
cross the read-only boundary, and `allow_write: true` passes
`--dangerously-skip-permissions`, which grants broad write permissions. They
should stay clearly warned wherever they are documented and should be used only
in trusted repos.

Background review should use the same manual path with `background: true`, then
`claude_status`, `claude_result`, and optionally `claude_cancel`. Cancellation
wording should always include the process-lifetime limit.

The `Stop` hook is also outside default onboarding. It is advanced opt-in
automation because it can loop, block Codex completion, and create usage-cost
risk.

Hook disable checklist:

1. Remove this plugin's `hooks.Stop` block from the active Codex config.
2. Or disable the individual hook through `/hooks`.
3. Set `[features] hooks = false` only when the whole local Codex config should
   disable hooks.

GSD/gstack review workflows may call this bridge as an outside-model check, but
the bridge itself should stay workflow-agnostic. Its job is to expose Claude Code
cleanly to Codex; it should not own phase state, PR policy, milestone promotion,
or team process.

## Failure categories

Runtime and setup output should make these categories actionable:

- `missing binary`: `CLAUDE_BIN` does not launch Claude Code.
- `auth/reachability`: Claude is not authenticated or cannot be reached.
- `timeout`: `CLAUDE_TIMEOUT_MS` or MCP `tool_timeout_sec` is too low for the
  review.
- `malformed JSON` / text fallback: Claude output was not parseable JSON, so the
  raw text is preserved.
- `context too large`: retry with a narrower `base`, `focus`, file scope, or
  background flow.

## Caveats

- Codex hooks and the `codex mcp` config format are marked experimental and have changed
  between releases. Verify event names (`Stop`, etc.) and config keys against the Codex
  docs for your installed version.
- Read-only mode restricts Claude's tools; if Claude attempts a disallowed tool it can
  stall, which is why per-call timeouts and `tool_timeout_sec` are set.
- Release-date revalidation is required before release-facing docs claim current
  external behavior. Re-check Codex CLI/MCP config, hook behavior, Claude Code
  CLI behavior, model aliases, billing/Agent SDK usage, and npm package setup
  against official docs and local smoke checks for the release date.
