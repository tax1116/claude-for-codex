# Setup & Usage

Step-by-step guide to wiring `claude-for-codex` into OpenAI Codex CLI.

## Prerequisites

- Node.js >= 18.18
- **Codex CLI** installed and logged in
  ```bash
  npm i -g @openai/codex
  codex login
  ```
- **Claude Code** installed and logged in (run `claude` once interactively to auth)
  ```bash
  npm i -g @anthropic-ai/claude-code
  claude
  ```

## Runtime

`claude-for-codex` runs as a Node.js MCP server launched by Codex. Node is the
chosen runtime because MCP server wiring, JSON tool schemas, and team setup are
all simpler in the Codex/Claude ecosystem.

The current implementation is ESM JavaScript (`server.mjs`). The intended team
rollout shape is Node + TypeScript for the MCP server, with small `.mjs` scripts
kept for hooks and setup helpers.

## 1. Install the server

```bash
cd claude-for-codex
npm install
```

## 2. Register the MCP server with Codex

Add to `~/.codex/config.toml` (use an **absolute** path):

```toml
[mcp_servers.claude]
command = "node"
args = ["/ABS/PATH/claude-for-codex/server.mjs"]
tool_timeout_sec = 700          # claude runs can exceed the 60s default
env = { CLAUDE_MODEL = "sonnet" }
```

Restart Codex. Tools appear namespaced as `claude:claude_review`,
`claude:claude_rescue`, etc. Codex may call them on its own, or you can ask
directly, e.g. *"Use Claude to adversarially review my diff against main."*

## 3. (Optional) Slash-command UX

Copy the prompt files so they show as `/claude-review`, `/claude-adversarial`,
`/claude-rescue`:

```bash
cp prompts/*.md ~/.codex/prompts/
```

## 4. (Optional) Review gate - auto-review before Codex finishes a turn

This is not part of the default install. Use it only when you explicitly want a
Claude review to run during the Codex `Stop` lifecycle event.

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

When Codex tries to end a turn, the hook asks Claude to inspect `git status --short`,
review tracked changes with `git diff HEAD` / `git diff --cached`, and read
untracked files directly. If Claude returns `BLOCK: <reason>`, the hook exits 2
and Codex is blocked from stopping, with the reason fed back so it can fix the
issue.

> **Warning:** the review gate can create a long Codex<->Claude loop and drain
> usage limits fast. Enable it only while actively monitoring the session.
> Hooks are experimental in Codex and disabled on Windows.

To disable only this review gate, remove this plugin's `hooks.Stop` block or use
Codex's `/hooks` UI to disable the individual hook. To disable all Codex hooks in
that config layer, set:

```toml
[features]
hooks = false
```

## Tools reference

| Tool | Args | Purpose |
| --- | --- | --- |
| `claude_setup` | – | Verify Claude Code is installed/reachable |
| `claude_review` | `base?, background?, cwd?` | Read-only review of worktree or branch changes |
| `claude_adversarial_review` | `base?, focus?, background?, cwd?` | Steerable challenge review |
| `claude_rescue` | `task, model?, resume?, fresh?, allow_write?, background?, cwd?` | Delegate work to Claude |
| `claude_status` | `task_id?, cwd?` | Running + recent jobs for this repo |
| `claude_result` | `task_id?, cwd?` | Final output (+ `claude --resume <id>` hint) |
| `claude_cancel` | `task_id?, cwd?` | Cancel a background job |

`resume: true` continues the latest Claude session in the repo; pass a specific
session id to target one.

## Environment variables

| Variable | Default | Meaning |
| --- | --- | --- |
| `CLAUDE_BIN` | `claude` | Claude Code binary path |
| `CLAUDE_MODEL` | `sonnet` | Default model alias/id |
| `CLAUDE_TIMEOUT_MS` | `600000` | Per-call timeout (<= `tool_timeout_sec * 1000`) |
| `CLAUDE_FOR_CODEX_STORE` | `~/.claude-for-codex/jobs` | Job store directory |
| `CODEX_CC_STORE` | – | Legacy alias for the job store |

## Safety

- Read-only by default: Claude may read files and run `git diff/log/status/show` only.
- `allow_write: true` passes `--dangerously-skip-permissions` — use only in trusted repos.
- Jobs are tracked while the MCP server process is alive; killing the server ends its jobs.
