# claude-for-codex

## What This Is

`claude-for-codex` is a local MCP plugin that lets Codex ask Claude Code for an
independent second opinion during review, design, and rescue workflows. It is
the conceptual reverse of `codex-plugin-cc`: instead of Claude Code calling
Codex, Codex can call Claude Code when another model perspective would improve
the work.

The first team rollout is not automatic review. The standard path is manual:
use a slash command or MCP tool when Codex's current context may be too narrow
and a separate design/risk review would help.

## Core Value

Codex users can deliberately ask Claude Code for independent design critique and
implementation-risk review before committing to a plan or change.

## Requirements

### Validated

<!-- Existing behavior inferred from the current codebase map. -->

- [existing] Codex can launch a local Node.js MCP server over stdio.
- [existing] The MCP server can invoke the local Claude Code CLI with
  `claude -p --output-format json`.
- [existing] Manual tools exist for setup, review, adversarial review, rescue,
  status, result, and cancellation.
- [existing] Claude runs are read-only by default with a restricted tool
  allowlist for file reads and read-style git commands.
- [existing] Background jobs are persisted in a file-backed repo-scoped job
  store.
- [existing] The latest Claude session id is remembered so later rescue work can
  resume a repo session.
- [existing] Slash-command prompt wrappers exist for review, adversarial review,
  and rescue workflows.
- [existing] A Codex `Stop` hook exists as an optional review gate, but is not
  part of the default install path.
- [existing] CI runs lint, syntax checks, and npm package dry-run checks across
  Node 18, 20, and 22.

### Active

<!-- Current scope. Building toward these. -->

- [ ] Make "design review from another model perspective" the primary v1 team
  workflow.
- [ ] Keep the product usable through both MCP tools and slash commands, while
  documenting slash commands as the standard team rollout path.
- [ ] Shape the v1 review prompt around two lenses: design critique and
  implementation-risk detection.
- [ ] Ensure review input is grounded in repo state, diff, planning docs, and an
  optional user focus instead of pretending Claude sees the full Codex chat
  context.
- [ ] Extract the job/state core from the monolithic `server.mjs` so status,
  result, cancel, and resume semantics are testable.
- [ ] Add deterministic tests for job-store behavior without requiring a live
  Claude account.
- [ ] Clarify follow-up/session behavior so users know when they are continuing
  a Claude session versus starting a fresh review.
- [ ] Improve failure handling for token/context exhaustion, stale running jobs,
  and Claude CLI launch/auth failures.
- [ ] Keep hooks opt-in and clearly reversible.
- [ ] Keep `allow_write` explicitly guarded and outside the default review path.

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Automatic Claude review by default - team rollout should avoid surprise usage
  cost and Codex/Claude stop loops.
- Hook-first onboarding - hooks are useful later, but manual invocation is the
  safer first learning path.
- Cloud service or hosted queue - the project is local-first and depends on the
  user's local Claude Code authentication.
- Replacing Codex's own planning or review - Claude is a second opinion, not the
  primary orchestrator.
- Claiming full Codex chat-context transfer - v1 should pass explicit artifacts
  and focus, not imply invisible context sharing.
- Broad public plugin-marketplace polish - team usability comes before a wider
  Codex-user growth goal.
- Write-enabled rescue as a normal workflow - write access remains exceptional
  because it bypasses the default read-only safety boundary.

## Context

This project started from the idea of reversing `codex-plugin-cc`. The useful
mirror is not just "call another CLI"; it is giving Codex users a deliberate
way to ask Claude Code for the kind of perspective the current Codex context may
miss.

The team's first need is not an always-on auto-reviewer. Team members use Codex
in different ways, and not everyone will have the same comfort level with hooks
or multi-agent review loops. The rollout should therefore make the manual path
feel obvious: ask for a design review when the plan feels consequential, risky,
or too self-confirming.

The product promise for v1 centers on two review lenses:

- Design critique: challenge architecture boundaries, complexity, assumptions,
  and simpler alternatives.
- Implementation-risk detection: surface missing tests, state-management risks,
  cancellation/resume edge cases, context-limit issues, and failure modes before
  implementation or merge.

The current implementation already proves the rough MCP shape. It still needs a
cleaner core boundary, stronger tests, clearer session/follow-up semantics, and
failure handling before it becomes a reliable team plugin.

## Constraints

- **Runtime**: Node.js MCP server - chosen to match the Codex/Claude plugin
  ecosystem and keep team installation simple.
- **Current implementation**: ESM JavaScript `.mjs` files - no TypeScript build
  exists on the current branch.
- **Local dependency**: Claude Code must be installed and authenticated on the
  user's machine.
- **Safety**: Read-only review is the default; write-capable rescue must remain
  explicit and warned.
- **Workflow**: Manual MCP/slash invocation is the standard rollout path; hooks
  remain optional.
- **Distribution**: npm package contents are controlled by the `files` array, so
  new runtime files must be added there before publishing.
- **Verification**: CI currently proves lint, syntax, and pack contents; future
  behavior changes need focused tests.
- **Repository flow**: Development proceeds from `dev` feature branches, with
  protected `master` for stable history.
- **Legal**: The project is unofficial and must avoid implying affiliation with
  OpenAI or Anthropic.

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use Node.js for the MCP server | MCP SDK wiring and npm install are the simplest team path. | - Pending |
| Support both MCP tools and slash commands | MCP gives capability; slash commands give learnable team UX. | - Pending |
| Document slash commands as the team standard path | Team rollout should start from an easy manual command, not hidden tool invocation. | - Pending |
| Keep hooks opt-in | Automatic review can loop and consume usage unexpectedly. | - Pending |
| Center v1 on design critique and implementation-risk detection | This is the distinct "other model perspective" value the team asked for. | - Pending |
| Pass explicit artifacts rather than pretending to share full Codex context | Claude Code sees what we provide through repo state, diff, docs, and prompt focus. | - Pending |
| Extract core state before broad feature growth | The current monolithic server makes status/result/cancel behavior hard to test. | - Pending |
| Track stable GSD planning docs but ignore runtime state | Codebase maps should be reviewable; logs, locks, and active runtime markers should stay local. | - Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `$gsd-transition`):
1. Requirements invalidated? Move to Out of Scope with reason.
2. Requirements validated? Move to Validated with phase reference.
3. New requirements emerged? Add to Active.
4. Decisions to log? Add to Key Decisions.
5. "What This Is" still accurate? Update if drifted.

**After each milestone** (via `$gsd-complete-milestone`):
1. Full review of all sections.
2. Core Value check - still the right priority?
3. Audit Out of Scope - reasons still valid?
4. Update Context with current state.

---
*Last updated: 2026-06-08 after initialization*
