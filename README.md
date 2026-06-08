# claude-for-codex

Unofficially call **Claude Code** from **OpenAI Codex CLI** for review and rescue workflows.
This is a conceptual counterpart to [`openai/codex-plugin-cc`](https://github.com/openai/codex-plugin-cc),
which goes the other way (Claude Code → Codex). Built on a Node.js MCP server plus optional
Codex hooks.

This project is independently maintained and is not affiliated with, endorsed by, or sponsored by
OpenAI or Anthropic.

## Feature mapping vs codex-plugin-cc

| codex-plugin-cc (CC → Codex) | This plugin (Codex → CC)        | How                                  |
| ---------------------------- | ------------------------------- | ------------------------------------ |
| `/codex:review`              | `claude_review`                 | MCP tool                             |
| `/codex:adversarial-review`  | `claude_adversarial_review`     | MCP tool (takes `focus`)             |
| `/codex:rescue`              | `claude_rescue`                 | MCP tool (`resume`/`fresh`/`model`/`allow_write`) |
| `/codex:status`              | `claude_status`                 | MCP tool + file-backed job store     |
| `/codex:result`              | `claude_result`                 | MCP tool (+ Claude session id)       |
| `/codex:cancel`              | `claude_cancel`                 | MCP tool                             |
| `/codex:setup`               | `claude_setup`                  | MCP tool                             |
| `--background` / `--wait`    | `background: true`              | detached job + status/result         |
| Review gate (`Stop` hook)    | `hooks/review-gate.mjs`         | **Codex Stop hook** (exit 2 = block) |
| `/codex:*` slash commands    | `prompts/claude-*.md`           | Codex custom prompts (`/claude-review`, …) |

Not 1:1: Claude-Code-only UI surfaces (e.g. the `/agents` subagent list). The behavior is
covered by the tools above.

## Prerequisites

- Node.js >= 18.18
- Codex CLI installed + logged in (`npm i -g @openai/codex`, `codex login`)
- Claude Code installed + logged in (`npm i -g @anthropic-ai/claude-code`, run `claude` once)

## Runtime choice

This project uses Node.js for the MCP server. That matches the surrounding
Codex/Claude plugin ecosystem, keeps MCP tool definitions simple, and gives team
members the same `npm install` setup path they already use for Claude Code.

The current server is a small ESM `.mjs` implementation. For team rollout, the
planned direction is Node + TypeScript for the MCP server body, while keeping
small hook and setup scripts as `.mjs` where that stays simpler.

## Install

```bash
cd claude-for-codex && npm install
```

## 1) Register the MCP server

In `~/.codex/config.toml` (absolute path):

```toml
[mcp_servers.claude]
command = "node"
args = ["/ABS/PATH/claude-for-codex/server.mjs"]
tool_timeout_sec = 700          # claude runs can exceed the 60s default
env = { CLAUDE_MODEL = "sonnet" }
```

Tools then appear namespaced as `claude:claude_review`, `claude:claude_rescue`, etc. Codex can
call them on its own, or you can ask: *"Use Claude to adversarially review my diff against main."*

## 2) (Optional) Slash-command UX

Copy the prompt files so they show up as `/claude-review`, `/claude-adversarial`, `/claude-rescue`:

```bash
cp prompts/*.md ~/.codex/prompts/
```

## 3) (Optional) Review gate - auto-review before Codex finishes

The review gate is opt-in. Installing the MCP server does not enable automatic
Claude review. Enable this only when you intentionally want Codex lifecycle
automation.

Add to `~/.codex/config.toml`:

```toml
[features]
hooks = true

[[hooks.Stop]]
matcher = ".*"
[[hooks.Stop.hooks]]
type = "command"
command = 'node "/ABS/PATH/claude-for-codex/hooks/review-gate.mjs"'
timeout = 300
```

When Codex tries to finish a turn, the hook asks Claude to inspect `git status --short`, review
tracked changes with `git diff HEAD` / `git diff --cached`, and read untracked files directly. If
Claude returns `BLOCK: <reason>`, the hook exits 2 and Codex is blocked from stopping, with the
reason fed back so it can fix the issue. Hooks are experimental and disabled on Windows.

> **Warning:** the review gate can create a long Codex↔Claude loop and drain usage limits fast.
> Enable it only when actively monitoring the session.

To turn the gate off, remove this plugin's `hooks.Stop` block or disable the
individual hook through `/hooks`. To turn all Codex hooks off for a local config,
set `[features] hooks = false`.

## Tools

- `claude_setup` — verify Claude Code is installed/reachable.
- `claude_review {base?, background?, cwd?}` — read-only review of worktree or branch changes.
- `claude_adversarial_review {base?, focus?, background?, cwd?}` — steerable challenge review.
- `claude_rescue {task, model?, resume?, fresh?, allow_write?, background?, cwd?}` — delegate work;
  `resume:true` continues the latest repo session, or pass a specific session id.
- `claude_status {task_id?, cwd?}` — running + recent jobs for this repo.
- `claude_result {task_id?, cwd?}` — final output (+ `claude --resume <id>` hint).
- `claude_cancel {task_id?, cwd?}` — cancel a background job.

## Config (env)

| Variable            | Default                              | Meaning                          |
| ------------------- | ------------------------------------ | -------------------------------- |
| `CLAUDE_BIN`        | `claude`                             | Claude Code binary path          |
| `CLAUDE_MODEL`      | `sonnet`                             | Default model alias/id           |
| `CLAUDE_TIMEOUT_MS` | `600000`                             | Per-call timeout (≤ `tool_timeout_sec*1000`) |
| `CLAUDE_FOR_CODEX_STORE` | `~/.claude-for-codex/jobs`       | Job store directory              |
| `CODEX_CC_STORE`    | –                                    | Legacy alias for the job store   |

## Safety

- Read-only by default: Claude may read files and run `git diff/log/status/show` only.
- `allow_write: true` passes `--dangerously-skip-permissions` — use only in trusted repos.
- Jobs are tracked while the MCP server process is alive; killing the server ends its jobs.
- Billing: as of mid-2026, `claude -p` / Agent SDK usage on subscription plans draws from a
  separate monthly Agent SDK credit. Check current Claude Code docs.

## Status

This is a starting point, not an official OpenAI/Anthropic plugin. Verify current Codex hook
event names and MCP config format against the Codex docs for your installed version.

## Documentation

- [docs/SETUP.md](docs/SETUP.md) — detailed install, config, tools, and env reference
- [docs/DESIGN.md](docs/DESIGN.md) — feature mapping vs codex-plugin-cc and how it works
- [docs/PUBLISHING.md](docs/PUBLISHING.md) — naming and how to push to your own GitHub repo
- [docs/BRANCHING.md](docs/BRANCHING.md) — branch roles, merge flow, and release promotion policy

## License

Apache-2.0. Copyright 2026 tax1116.
