# Codebase Map: Integrations

Date: 2026-06-08

## Codex MCP Integration

The core integration is Codex launching this package as an MCP server over
stdio.

Expected Codex config shape:

```toml
[mcp_servers.claude]
command = "node"
args = ["/ABS/PATH/claude-for-codex/server.mjs"]
tool_timeout_sec = 700
env = { CLAUDE_MODEL = "sonnet" }
```

The server uses `StdioServerTransport` from `@modelcontextprotocol/sdk` and
registers tools on a single `McpServer` instance.

## Claude Code CLI

Every user-facing MCP tool ultimately shells out to the Claude Code CLI.

- Default binary: `claude`.
- Override: `CLAUDE_BIN`.
- Default model alias: `sonnet`.
- Override: `CLAUDE_MODEL`.
- Prompt mode: `claude -p`.
- Output format: `--output-format json`.
- Resume support: `--resume <session_id>`.

The server parses Claude JSON output for:

- `session_id`
- `result`
- `is_error`
- `total_cost_usd`
- `num_turns`

If JSON parsing fails, it falls back to raw stdout/stderr.

## Git

Git is used in two ways:

- The server computes a repo-scoped job-store key with
  `git rev-parse --show-toplevel`.
- Claude review prompts instruct Claude to inspect changes with read-only git
  commands such as `git status`, `git diff`, `git diff --cached`, `git log`, and
  `git show`.

The default Claude tool allowlist permits only read-style git commands:

- `Bash(git diff:*)`
- `Bash(git log:*)`
- `Bash(git status:*)`
- `Bash(git show:*)`

## File-Backed Job Store

Background job state is persisted under:

- `CLAUDE_FOR_CODEX_STORE`, or
- `CODEX_CC_STORE`, or
- `~/.claude-for-codex/jobs`.

Jobs are grouped by a short hash of the git repository root. The server writes
one JSON file per task plus `last-session.txt` for `resume: true`.

Important limitation: cancellation depends on the current MCP server process
also having the child process in the in-memory `live` map. Persisted JSON state
survives process restart, but the process handle does not.

## Codex Stop Hook

`hooks/review-gate.mjs` is an optional Codex lifecycle hook.

Config shape:

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

Behavior:

- Reads the Codex hook event JSON from stdin.
- Uses `evt.cwd` when present.
- Runs a quick read-only Claude review.
- Exits `2` when Claude returns `BLOCK: ...`.
- Exits `0` otherwise.

This hook is explicitly opt-in because it can create repeated Codex-to-Claude
review loops and consume usage quickly.

## Slash Command Prompts

`prompts/claude-review.md`, `prompts/claude-adversarial.md`, and
`prompts/claude-rescue.md` are copied into `~/.codex/prompts/` for a slash-style
UX.

These prompt files are wrappers around the MCP tool workflow rather than a
separate runtime integration.

## GitHub Actions

CI is configured in `.github/workflows/ci.yml`.

Triggers:

- `workflow_dispatch`
- `pull_request`
- push to `main`, `master`, and `dev`

Matrix:

- Node `18.x`
- Node `20.x`
- Node `22.x`

Checks:

- `npm ci`
- `npm run ci`

## External Services Not Present

The current project does not integrate with:

- A database.
- A remote application API.
- A hosted web service.
- OAuth.
- Cloud storage.
- Observability tooling.

The only external runtime dependency is the locally installed Claude Code CLI.

## Legal And Branding Integration Points

The README and docs state that this project is unofficial and not affiliated
with OpenAI or Anthropic.

The current license is Apache-2.0, with copyright assigned to `tax1116` in the
README and repository metadata.
