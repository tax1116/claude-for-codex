# Phase 1: Manual Design/Risk Review Core - Research

**Researched:** 2026-06-08
**Status:** Ready for planning

## RESEARCH COMPLETE

Phase 1 should keep the current Node ESM MCP server shape and make the manual
review path trustworthy before extracting larger modules or adding fake-Claude
test fixtures. The vertical slice for this phase is: a teammate installs the
package, registers the local stdio MCP server, invokes `/claude-review` or
`/claude-adversarial`, Claude receives only explicit repo context, and the user
gets prioritized read-only findings with clear caveats.

## Local Findings

### Runtime surface

- `server.mjs` already contains the MCP server, tool schemas, Claude runner,
  prompt builders, job store helpers, and read-only tool restrictions.
- `READ_ONLY_ALLOW` currently allows `Read`, `Grep`, `Glob`, and read-style git
  commands for `git diff`, `git log`, `git status`, and `git show`.
- `WRITE_DISALLOW` currently blocks `Edit`, `Write`, `MultiEdit`, and
  `NotebookEdit`.
- `claude_review` already accepts `base`, `background`, and `cwd`; it does not
  yet accept `focus`, so implementation-risk narrowing is only available through
  natural language in slash prompts or through the adversarial tool.
- `claude_adversarial_review` accepts `base`, `focus`, `background`, and `cwd`.
- `claude_setup` only checks `claude --version`; it should report binary,
  auth/reachability guidance, timeout alignment, and next actions without
  requiring a costly live review run.
- The current review prompt asks for `[high/med/low]`; Phase 1 requires
  human-readable `High`, `Medium`, and `Low`.
- Current result formatting does not guarantee the final response says the
  review was read-only and no files were edited.

### Slash prompt surface

- `prompts/claude-review.md` and `prompts/claude-adversarial.md` are thin
  wrappers around MCP tools.
- They should become the standard team entry point and explicitly document the
  optional `base` and `focus` inputs.
- They should tell Codex to pass `background: true` for broad diffs but keep
  the default mental model manual and user-triggered.

### Docs surface

- `README.md`, `docs/SETUP.md`, and `docs/DESIGN.md` already explain MCP
  registration, tools, hooks, and safety.
- They still emphasize MCP tools before slash commands and include a future
  TypeScript direction. Phase 1 should present slash commands as the standard
  rollout path and keep TypeScript migration out of v1.
- Hook setup exists and can remain documented only as optional advanced
  behavior. It must not be part of default onboarding.
- Docs preserve unofficial/non-affiliation language already; keep that language
  visible after edits.

## External Findings

### Claude Code CLI

Anthropic's Claude Code CLI reference documents non-interactive print mode via
`claude -p`, JSON output via `--output-format json`, turn limits via
`--max-turns`, model selection via `--model`, session continuity via
`--resume`, and permission/tool controls such as `--allowedTools`,
`--disallowedTools`, and `--dangerously-skip-permissions`.

Planning implication: keep using the current CLI runner shape, but centralize
Phase 1 prompt/result contracts around explicit read-only mode and clear
failure categories. Treat `resume` as Claude session continuity only.

Source: https://docs.anthropic.com/en/docs/claude-code/cli-usage

### MCP TypeScript SDK / local stdio server

The MCP TypeScript SDK documentation describes local process-spawned stdio
servers and the `McpServer` plus `StdioServerTransport` pattern used by this
repo. The official MCP server guide also shows the same imports.

Planning implication: no runtime migration is required for Phase 1. The current
Node ESM `.mjs` server can remain the implementation body while plans improve
the tool contract and docs.

Sources:
- https://ts.sdk.modelcontextprotocol.io/
- https://modelcontextprotocol.io/docs/develop/build-server

### codex-plugin-cc comparison

`openai/codex-plugin-cc` exposes slash-command-first workflows such as
`/codex:review`, `/codex:adversarial-review`, `/codex:status`,
`/codex:result`, `/codex:cancel`, and `/codex:setup`, with background status
and result examples. It also documents its Stop hook review gate as optional
and warns about long-running loops and usage limits.

Planning implication: mirror the user-facing shape, not the exact runtime. For
this repo, `/claude-review` and `/claude-adversarial` should be the team-facing
standard, while MCP tool names remain the reference interface.

Source: https://github.com/openai/codex-plugin-cc/blob/main/README.md

## Planning Implications

### Slice 1: runtime review contract

Modify `server.mjs` in place. Do not extract a job-store module yet; Phase 2
owns runner/job-store testability. Phase 1 should:

- add a `focus` input to `claude_review`;
- make review and adversarial prompts state the explicit context contract;
- keep selected `.planning` docs current-phase scoped;
- require `git status --short --branch` plus relevant untracked file reads;
- require `High`, `Medium`, `Low`, and `No high-confidence findings`;
- append a no-edit/read-only statement and reviewed-scope caveat to results;
- categorize launch, auth/reachability, timeout, malformed JSON/text fallback,
  and likely context-too-large failures where feasible;
- make setup output useful for binary, auth/reachability, timeout, model, and
  MCP timeout diagnosis.

### Slice 2: slash-command-first team rollout

Modify `prompts/claude-review.md`, `prompts/claude-adversarial.md`,
`README.md`, `docs/SETUP.md`, and `docs/DESIGN.md`. Phase 1 should:

- present slash commands before raw MCP tool calls;
- keep MCP names as the reference interface;
- explain optional `base` and `focus` controls;
- distinguish implementation-risk review from adversarial design critique;
- state Claude does not receive the full Codex chat automatically;
- keep hooks out of default onboarding and label them advanced opt-in;
- preserve unofficial/non-affiliation language for OpenAI and Anthropic.

## Validation Architecture

The cheapest useful validation for Phase 1 is source and packaging verification:

- `npm run ci`
- `node --check server.mjs`
- `rg "High|Medium|Low|No high-confidence findings" server.mjs README.md docs prompts`
- `rg "no files were edited|read-only|full Codex chat|slash" server.mjs README.md docs prompts`
- `npm pack --dry-run --cache ./.npm-cache`

Live Claude runs are not required in Phase 1 because they can consume credits and
depend on local authentication. Deterministic fake-Claude tests belong to Phase
2 under the quality requirements.

## Open Questions

No blocking product questions remain for Phase 1. The main execution risk is
scope creep: implementing the Phase 2 job-store/test harness while only trying
to lock the manual review contract.
