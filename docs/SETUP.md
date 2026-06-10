# Setup & Usage

Step-by-step guide to wiring `claude-for-codex` into OpenAI Codex CLI.

Use this when Codex is your main workspace and you want Claude Code available as
a manual second-opinion bridge, without switching to a Claude-first workflow such
as `codex-plugin-cc`.

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
rollout shape is the current Node `.mjs` MCP server. A TypeScript migration is
deferred until module boundaries and package strategy justify a build step.

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

## 3. Standard slash-command workflow

Copy the prompt files so they show as `/claude-review`, `/claude-adversarial`,
`/claude-rescue`:

```bash
cp prompts/*.md ~/.codex/prompts/
```

The standard workflow is a manual slash-command workflow:

1. Run `claude_setup` once after MCP registration.
2. Use `/claude-review` for implementation-risk review. It emphasizes missing
   tests, state edge cases, cancellation/resume behavior, context limits, and
   failure modes.
3. Use `/claude-adversarial` for design critique. It emphasizes architecture
   boundaries, complexity, assumptions, tradeoffs, and simpler alternatives.
4. Leave arguments empty for a normal current-work review, or provide optional
   `base` and `focus` text to narrow the scope.
5. Use `background: true` only for broad diffs, then fetch with
   `claude_status` and `claude_result`.

This workflow is intentionally manual. It is meant to replace tool-switching for
Codex-first users, not to make Claude Code review every Codex turn.

Concrete examples:

```text
/claude-review
/claude-review base=origin/dev
/claude-review base=origin/dev focus="job cancellation"
/claude-adversarial focus="simpler alternatives"
/claude-review background: true
claude_status "task-..."
claude_result "task-..."
claude_cancel "task-..."
```

`claude_cancel` is best effort and process-lifetime only. It can cancel a job
while the current MCP server still owns the Claude child process; it is not a
hosted durable queue cancellation.

Review output should be grouped by `High`, `Medium`, and `Low`. If Claude finds
no high-confidence issue, summarize it as `No high-confidence findings`. Review
results are read-only and should state that no files were edited.

Claude does not receive the full Codex chat automatically. The explicit context
is the prompt text, allowed read-only repo access, read-style git state,
selected planning docs, resumed Claude Code session output when used, and
user-provided `base` or `focus`.

## 4. Advanced opt-in review gate - auto-review before Codex finishes a turn

This is not part of the default install. Use it only when you explicitly want a
Claude review to run during the Codex `Stop` lifecycle event. This is an
advanced opt-in path, not the team onboarding default.

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

> **Warning:** the review gate can create a long Codex<->Claude loop, cause
> blocking at turn completion, and create usage-cost risk. Enable it only while
> actively monitoring the session. Hooks are experimental in Codex and disabled
> on Windows.

Disable checklist:

1. Remove this plugin's `hooks.Stop` block from the active Codex config.
2. Or use Codex's `/hooks` UI to disable the individual hook.
3. To disable all Codex hooks in that config layer, set:

```toml
[features]
hooks = false
```

## Tools reference

MCP tool names are the reference interface under the slash-command workflow.

| Tool | Args | Purpose |
| --- | --- | --- |
| `claude_setup` | – | Verify Claude Code is installed/reachable |
| `claude_review` | `base?, focus?, background?, cwd?` | Read-only review of worktree or branch changes |
| `claude_adversarial_review` | `base?, focus?, background?, cwd?` | Steerable challenge review |
| `claude_rescue` | `task, model?, resume?, fresh?, allow_write?, background?, cwd?` | Delegate work to Claude |
| `claude_status` | `task_id?, cwd?` | Running + recent jobs for this repo |
| `claude_result` | `task_id?, cwd?` | Final output (+ `claude --resume <id>` hint) |
| `claude_cancel` | `task_id?, cwd?` | Cancel a background job |

`resume: true` continues the latest Claude Code session in the repo; pass a
specific session id to target one. `resume` is Claude Code session continuity
only; it does not transfer the full Codex chat.

## Setup diagnostics and failure categories

`claude_setup` reports the configured `CLAUDE_BIN`, `CLAUDE_MODEL`,
`CLAUDE_TIMEOUT_MS`, and `tool_timeout_sec` alignment guidance. It checks basic
CLI availability, but it does not prove that a live review will fit the selected
timeout or context.

Common categories:

- `missing binary`: install Claude Code or set `CLAUDE_BIN` to an absolute path.
- `auth/reachability`: run `claude auth status` if available, or run `claude`
  once interactively.
- `timeout`: increase `CLAUDE_TIMEOUT_MS` and MCP `tool_timeout_sec` together,
  or retry with `background: true`.
- `malformed JSON`: Claude did not return parseable JSON; use the text fallback
  for debugging.
- `context`: retry with a narrower `base`, `focus`, or file scope when the
  review may be too large.

## Environment variables

| Variable | Default | Meaning |
| --- | --- | --- |
| `CLAUDE_BIN` | `claude` | Claude Code binary path |
| `CLAUDE_MODEL` | `sonnet` | Default model alias/id |
| `CLAUDE_TIMEOUT_MS` | `600000` | Per-call timeout (<= `tool_timeout_sec * 1000`) |
| `CLAUDE_FOR_CODEX_STATE` | `~/.claude-for-codex/state` | Canonical repo-scoped state root |
| `CLAUDE_FOR_CODEX_STORE` | `~/.claude-for-codex/jobs` | Legacy job store read path |
| `CODEX_CC_STORE` | – | Legacy alias for old job reads |

## Safety

- Read-only by default: Claude may read files and run `git diff/log/status/show` only.
- `allow_write: true` on `claude_rescue` is outside the standard v1 review path
  and passes `--dangerously-skip-permissions`, which grants broad write
  permissions. Use it only in trusted repos.
- Jobs are persisted in repo-scoped state, but cancellation is best effort only
  while the current MCP server process owns the child process.

## Release-date revalidation

These setup notes include external-tool behavior that can drift. Before a team
rollout, npm publish, or release tag, re-check the following against official
docs for the release date:

| Claim area | What to re-check |
| --- | --- |
| Codex CLI/MCP config | MCP server config keys, absolute-path requirements, and `tool_timeout_sec` behavior |
| hook behavior | Stop hook event name, `/hooks` UI, disable behavior, and Windows support |
| Claude Code CLI behavior | install command, auth command/status, `claude -p`, JSON output, and resume behavior |
| model aliases | whether aliases such as `sonnet` remain accepted for the selected Claude Code version |
| billing/Agent SDK usage | usage accounting, plan limits, and Agent SDK billing language |
| npm package setup | `npm ci`, `npm run ci`, package files, and `npm pack --dry-run --cache ./.npm-cache` |

Do not publish release-facing docs as current external behavior until those
official docs and local smoke checks have been reviewed for the release date.
