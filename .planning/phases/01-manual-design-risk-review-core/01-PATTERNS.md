# Phase 1: Manual Design/Risk Review Core - Patterns

**Mapped:** 2026-06-08
**Status:** Ready for planning

## Files and Existing Analogs

### `server.mjs`

Role: MCP server entrypoint, tool registry, Claude CLI runner, prompt builder,
and result formatter.

Closest existing patterns:

- Tool registration uses `server.registerTool(name, { title, description,
  inputSchema }, handler)` with inline `zod` schemas.
- Claude execution flows through `buildArgs`, `startJob`, `runForeground`, and
  `startBackground`.
- Read-only safety is encoded by `READ_ONLY_ALLOW` and `WRITE_DISALLOW`.
- Review prompts are currently isolated in `reviewRangeInstruction`,
  `untrackedInstruction`, `reviewPrompt`, and `adversarialPrompt`.
- Job output is shaped by `fmtJob`.

Planning guidance:

- Preserve the monolithic ESM entrypoint for Phase 1.
- Add small helper functions only where they reduce duplicated setup, failure,
  prompt, or result text.
- Keep `allowWrite` false for review/adversarial tools.
- Keep new tool schemas inline with the current `zod` style.

### `prompts/claude-review.md`

Role: Codex custom prompt wrapper for implementation-risk review.

Closest existing pattern:

- The prompt asks Codex to call `claude.claude_review`, pass `base` when named,
  use `background: true` for broad diffs, and summarize by severity.

Planning guidance:

- Make it the standard team path.
- Explain optional `base` and `focus` as natural-language inputs Codex should
  map into the MCP tool call.
- Require the final user-facing summary to preserve scope, caveats, and the
  read-only/no-edit statement.

### `prompts/claude-adversarial.md`

Role: Codex custom prompt wrapper for adversarial design critique.

Closest existing pattern:

- The prompt asks Codex to call `claude.claude_adversarial_review`, pass `focus`
  and `base`, use background for large diffs, and present challenges ranked by
  risk.

Planning guidance:

- Keep it distinct from implementation-risk review.
- Focus on architecture boundaries, complexity, assumptions, and simpler
  alternatives.
- Keep output concrete and prioritized.

### `README.md`

Role: first-read install and workflow guide.

Closest existing pattern:

- Includes feature mapping vs `codex-plugin-cc`, prerequisites, MCP config,
  optional slash prompts, optional review gate, tools, config, safety, status,
  documentation, and license.

Planning guidance:

- Reorder the user journey so team rollout starts with install, MCP register,
  setup check, slash prompts, and first review.
- Keep MCP tools documented as the underlying reference surface.
- Keep hooks as optional advanced setup only.
- Remove or defer TypeScript migration wording from the v1 setup path.

### `docs/SETUP.md`

Role: detailed install, MCP config, prompts, hooks, tools, and environment
reference.

Closest existing pattern:

- Mirrors README but with more step-by-step setup detail.

Planning guidance:

- Add explicit setup diagnostic expectations.
- Make slash commands the standard path.
- Document `base`, `focus`, context limits, timeout alignment, and the no hidden
  Codex chat-transfer rule.

### `docs/DESIGN.md`

Role: architecture and feature mapping reference.

Closest existing pattern:

- Maps `codex-plugin-cc` to this repo, describes runtime, transport, job store,
  background execution, and hook contract.

Planning guidance:

- Add the explicit context contract.
- Define review vs adversarial prompt responsibilities.
- Keep safety boundaries and hook/rescue caveats crisp.

## Patterns To Avoid

- Do not migrate Phase 1 to TypeScript. Current requirements explicitly exclude
  a v1 TypeScript migration.
- Do not move default onboarding to hooks. Hooks are advanced opt-in.
- Do not make `claude_rescue` or `allow_write` part of the standard review path.
- Do not claim Claude receives the full Codex chat.
- Do not add live-Claude checks to CI or setup verification.
