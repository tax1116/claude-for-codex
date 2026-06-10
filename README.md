# claude-for-codex

Use **Claude Code** from inside **OpenAI Codex CLI** without changing your
primary workspace.

`claude-for-codex` is a Codex-first replacement workflow for teams that like the
idea behind [`openai/codex-plugin-cc`](https://github.com/openai/codex-plugin-cc)
but work primarily in Codex. `codex-plugin-cc` lets Claude Code call Codex; this
plugin lets Codex call Claude Code for manual review, adversarial critique,
rescue, background status, results, and cancellation.

Built on a local Node.js MCP server plus optional Codex hooks.

This project is independently maintained and is not affiliated with, endorsed by, or sponsored by
OpenAI or Anthropic.

## Product promise

Keep Codex as the main working surface, and call Claude Code only when a second
model perspective is worth the context switch.

This is not a GSD/gstack replacement, a PR review bot, or an always-on automatic
reviewer. It is a local model bridge: Codex stays in charge of the task, while
Claude Code can be invoked deliberately for critique, risk review, or recovery.

## Team rollout: slash commands first

The standard team path is a manual slash-command workflow:

1. Use Node.js >= 18.18.
2. Run `npm install` in this repository.
3. Register `server.mjs` in Codex MCP config with an absolute path.
4. Run `claude_setup` from Codex to confirm the effective Claude binary, model, timeout, and auth guidance.
5. Copy `prompts/*.md` into `~/.codex/prompts/` so teammates can use `/claude-review` and `/claude-adversarial`.
6. Ask Claude Code for a manual second opinion only when needed, without leaving
   Codex.

First examples:

- `/claude-review` - implementation-risk review for missing tests, state edge cases, cancellation/resume behavior, context limits, and failure modes.
- `/claude-review base=origin/dev focus="job cancellation"`
- `/claude-adversarial` - design critique for architecture boundaries, complexity, assumptions, tradeoffs, and simpler alternatives.
- `/claude-adversarial focus="simpler alternatives" background: true`

MCP tool names remain the reference interface underneath the slash prompts. The prompts call `claude_review` and `claude_adversarial_review`; the tools can still be invoked directly when you need exact arguments.

Background lifecycle example:

```text
/claude-review base=origin/dev background: true
claude_status "task-..."
claude_result "task-..."
claude_cancel "task-..."
```

Cancellation is best effort and process-lifetime only while the current MCP
server owns the Claude child process. It is not a hosted durable queue.

Claude does not receive the full Codex chat automatically. The explicit context is the prompt text, allowed read-only repo access, read-style git state, selected planning docs, resumed Claude Code session output when used, and user-provided `base` or `focus`.

## Replacement boundary vs codex-plugin-cc

Use `codex-plugin-cc` when Claude Code is your main workspace and Codex is the
outside reviewer. Use `claude-for-codex` when Codex is your main workspace and
Claude Code is the outside reviewer.

The goal is not API-level symmetry for every Claude Code UI surface. The goal is
to cover the workflow primitives a Codex-first team needs to stop switching
between tools for second opinions.

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

Not 1:1: Claude-Code-only UI surfaces such as the `/agents` subagent list. The
Codex-first workflow is covered by the tools above.

## Prerequisites

- Node.js >= 18.18
- Codex CLI installed and signed in. Use the official Codex install docs for
  your platform; npm and Homebrew remain documented alternatives.
- Claude Code installed and authenticated. Use the official Claude Code install
  docs, then verify with `claude --version` and `claude auth status`.

## Runtime choice

This project uses Node.js for the MCP server. That matches the surrounding
Codex/Claude plugin ecosystem, keeps MCP tool definitions simple, and gives team
members the same `npm install` setup path they already use for Claude Code.

The v1 team rollout uses the current small ESM `.mjs` server directly. A future
TypeScript migration is deferred until module boundaries and packaging strategy
are worth the extra build step.

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

## 2) Standard slash-command UX

Copy the prompt files so they show up as `/claude-review`, `/claude-adversarial`, `/claude-rescue`:

```bash
cp prompts/*.md ~/.codex/prompts/
```

## 3) Advanced opt-in review gate - auto-review before Codex finishes

The review gate is opt-in. Installing the MCP server does not enable automatic
Claude review. Enable this only when you intentionally want Codex lifecycle
automation. Treat hooks as an advanced path, not the team default.

Add to `~/.codex/config.toml`. Hooks are enabled by default in current Codex
CLI releases; only add `[features] hooks = true` if your config layer has
previously disabled them.

```toml
[[hooks.Stop]]
[[hooks.Stop.hooks]]
type = "command"
command = 'node "/ABS/PATH/claude-for-codex/hooks/review-gate.mjs"'
timeout = 300
```

When Codex tries to finish a turn, the hook asks Claude to inspect `git status --short`, review
tracked changes with `git diff HEAD` / `git diff --cached`, and read untracked files directly. If
Claude returns `BLOCK: <reason>`, the hook exits 2 and Codex is blocked from stopping, with the
reason fed back so it can fix the issue. For Windows-specific hook commands,
use Codex's `commandWindows` override.

> **Warning:** the review gate can create a long Codex↔Claude loop, cause blocking at turn
> completion, and create usage-cost risk. Enable it only when actively monitoring the session.

Disable checklist:

1. Remove this plugin's `hooks.Stop` block from the active Codex config.
2. Or disable the individual hook through `/hooks`.
3. To turn all Codex hooks off for a local config, set `[features] hooks = false`.

## Tools

- `claude_setup` — verify Claude Code is installed/reachable.
- `claude_review {base?, focus?, background?, cwd?}` — read-only review of worktree or branch changes.
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
| `CLAUDE_FOR_CODEX_STATE` | `~/.claude-for-codex/state`      | Canonical repo-scoped state root |
| `CLAUDE_FOR_CODEX_STORE` | `~/.claude-for-codex/jobs`       | Legacy job store read path       |
| `CODEX_CC_STORE`    | –                                    | Legacy alias for old job reads   |

## Safety

- Read-only by default: Claude may read files and run `git diff/log/status/show` only.
- `allow_write: true` on `claude_rescue` is outside the standard v1 review path
  and passes `--dangerously-skip-permissions`, which grants broad write
  permissions. Use it only in trusted repos.
- Jobs are tracked in repo-scoped state, but cancellation is best effort only
  while the MCP server process owns the child process.

## Release-date revalidation

Release-facing external-tool claims were revalidated on 2026-06-10 against the
official Codex and Claude Code docs plus local CLI smoke checks.

| Claim area | 2026-06-10 source of truth |
| --- | --- |
| Codex CLI/MCP config | Official Codex MCP docs and local `codex mcp --help` |
| hook behavior | Official Codex hook docs: hooks are enabled by default, `Stop` matcher is unused, `/hooks` controls review/disable |
| Claude Code CLI behavior | Official Claude Code CLI reference and local `claude --help` / `claude auth status` / `claude -p` smoke |
| model aliases | Official Claude Code CLI reference and local `claude --help` showed `sonnet` remains accepted |
| billing/Agent SDK usage | Official Claude Code cost docs; automated/team use can increase token usage |
| npm package setup | `npm ci`, `npm run ci`, and `npm pack --dry-run --cache ./.npm-cache` |

Before the next team rollout, npm publish, or release tag, repeat this
release-date revalidation instead of assuming external CLI, hook, model, or
billing behavior is still current.

## Status

This is a starting point, not an official OpenAI/Anthropic plugin. Re-check
current Codex hook event names and MCP config format against the Codex docs for
your installed version before each release.

## Documentation

- [docs/SETUP.md](docs/SETUP.md) — detailed install, config, tools, and env reference
- [docs/DESIGN.md](docs/DESIGN.md) — product boundary, codex-plugin-cc mapping, and mechanics
- [docs/PUBLISHING.md](docs/PUBLISHING.md) — naming and how to push to your own GitHub repo
- [docs/BRANCHING.md](docs/BRANCHING.md) — branch roles, merge flow, and release promotion policy

## License

Apache-2.0. Copyright 2026 tax1116.
