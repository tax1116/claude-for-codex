# Phase 1: Manual Design/Risk Review Core - Context

**Gathered:** 2026-06-08
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers the manual, slash-command-first review core for
`claude-for-codex`. Codex users can deliberately ask local Claude Code for
read-only design critique or implementation-risk review from inside Codex. MCP
tools remain the underlying capability surface, but team rollout starts from the
manual slash commands.

This phase does not make automatic review the default, does not enable hooks by
default, and does not make write-capable rescue part of the standard review
path.

</domain>

<decisions>
## Implementation Decisions

### Slash Command Contract
- **D-01:** Provide two primary team-facing slash commands: `/claude-review`
  for implementation-risk review and `/claude-adversarial` for design critique.
- **D-02:** Keep default command input minimal. Commands should work without
  required arguments, while `focus` and `base` remain optional narrowing inputs.
- **D-03:** Review output should be prioritized concrete findings, not a long
  narrative critique and not a broad verdict-first gate.
- **D-04:** Documentation should present slash commands first for team rollout
  and document MCP tools as the reference interface underneath.

### Explicit Context Contract
- **D-05:** Claude receives explicit repo/context inputs: repo state, diff or
  base-ref comparison, selected planning docs, and the user's focus. Docs and
  prompts must not imply automatic transfer of the full Codex chat.
- **D-06:** Review prompts must instruct Claude to inspect `git status` and
  consider relevant untracked files, not only tracked diffs.
- **D-07:** Planning docs should be selected for the current phase rather than
  passing every `.planning/**` file by default. The expected set is
  `PROJECT.md`, `REQUIREMENTS.md`, `ROADMAP.md`, the phase `CONTEXT.md`, and
  later the phase `PLAN.md` when available.
- **D-08:** `resume` means Claude Code session continuity only. It does not mean
  the full Codex chat context was transferred to Claude.

### Read-Only Safety Boundary
- **D-09:** Phase 1 review tools should allow only `Read`, `Grep`, `Glob`, and
  read-style git commands such as `git status`, `git diff`, `git log`, and
  `git show`.
- **D-10:** `claude_rescue` and `allow_write` may be mentioned, but only as
  outside the default review path and as a warned escape hatch.
- **D-11:** Review results should explicitly state that Claude review is
  read-only and no files were edited.
- **D-12:** Hooks stay outside default onboarding. Phase 1 may document them
  only as opt-in advanced behavior with loop, usage-cost, and blocking risks.

### Setup And Result Shape
- **D-13:** Setup checks should diagnose Claude binary presence,
  auth/reachability, and timeout-prone Codex MCP configuration.
- **D-14:** Findings should use human-readable severities: `High`, `Medium`,
  and `Low`.
- **D-15:** Empty or clean review results should say `No high-confidence
  findings` and include a short note about reviewed scope and remaining caveats.
- **D-16:** Claude execution failures should map to actionable categories where
  possible: missing binary, auth/reachability, timeout, malformed JSON or text
  fallback, and possible context-too-large guidance.

### the agent's Discretion
No user decision delegated product behavior to the agent. Downstream agents may
choose implementation details such as module names, helper boundaries, exact
copy, and test organization, as long as they preserve the decisions above and
the existing Node ESM/no-build package direction.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Contract
- `.planning/PROJECT.md` — Product promise, constraints, active scope, and
  out-of-scope boundaries for the local Codex-to-Claude review plugin.
- `.planning/REQUIREMENTS.md` — Requirement IDs covered by Phase 1, including
  setup, review, context, safety, and docs requirements.
- `.planning/ROADMAP.md` — Phase 1 goal, success criteria, dependency order,
  and requirement mapping.
- `.planning/STATE.md` — Current project state and pending next action.

### Research And Local Architecture
- `.planning/research/SUMMARY.md` — Researched product/architecture direction,
  pitfalls, and phase-order rationale.
- `.planning/codebase/STACK.md` — Runtime, package, dependency, CI, and
  packaging facts for the current Node ESM implementation.
- `.planning/codebase/ARCHITECTURE.md` — Current MCP server shape, state model,
  Claude runner flow, read-only boundary, and hook architecture.
- `.planning/codebase/INTEGRATIONS.md` — Codex MCP config, Claude CLI flags,
  job-store location, slash prompts, hook config, and CI integration points.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `server.mjs`: Existing MCP server, tool registration, prompt construction,
  Claude runner, and job-state helpers. Phase 1 should preserve behavior while
  planning cleaner boundaries.
- `prompts/claude-review.md` and `prompts/claude-adversarial.md`: Existing
  slash-command wrappers that should become the standard team path.
- `hooks/review-gate.mjs`: Existing optional Stop hook. It informs warnings and
  docs, but remains outside the default Phase 1 onboarding path.
- `docs/SETUP.md`, `docs/DESIGN.md`, and `README.md`: Existing user-facing docs
  that will need to reflect the slash-command-first and explicit-context
  contracts.

### Established Patterns
- The package is Node.js ESM with no build step. New runtime files must fit that
  package shape unless a later phase explicitly changes the stack.
- MCP tools use `@modelcontextprotocol/sdk` with inline `zod` input schemas.
- Claude is invoked locally with print-mode JSON output and read-only tool
  restrictions by default.
- Background state is repo-scoped and file-backed, with in-memory process
  handles only for live cancellation.
- npm package contents are controlled by `package.json` `files`, so any new
  runtime paths must be included before package checks can pass.

### Integration Points
- Codex launches the MCP server over stdio using an absolute local path.
- Claude execution depends on the user's local authenticated `claude` binary,
  optionally configured with `CLAUDE_BIN` and `CLAUDE_MODEL`.
- Review quality depends on read-style git state and explicit planning/doc
  context rather than hidden Codex conversation transfer.

</code_context>

<specifics>
## Specific Ideas

- Team rollout should teach `/claude-review` and `/claude-adversarial` first.
- `base` and `focus` should be easy optional controls, especially for narrowing
  broad or context-heavy reviews.
- Review output should be compact enough to act on directly from Codex.
- Failure output should help the user decide whether to install/authenticate
  Claude, increase timeout, narrow context, or inspect raw output fallback.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 1-Manual Design/Risk Review Core*
*Context gathered: 2026-06-08*
