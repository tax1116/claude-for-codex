# claude-for-codex

## What This Is

`claude-for-codex` is a local MCP plugin for Codex-first teams that want the
`codex-plugin-cc` workflow in the opposite primary workspace. Instead of moving
from Codex into Claude Code to get a second opinion, users keep Codex as the
main working surface and call Claude Code deliberately for review, adversarial
critique, rescue, background status, results, and cancellation.

The first team rollout is not automatic review. The v1 standard path was manual:
use a slash command or MCP tool when Codex's current context may be too narrow
and a separate design/risk review would help. The v2 direction is to make Codex
skills the standard team-facing workflow surface, with slash prompts kept only
as optional compatibility aliases if they remain useful.

## Core Value

Codex-first users can keep Codex as the task owner while calling Claude Code as a
local second-opinion bridge for design critique, implementation-risk review, and
recovery.

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
- [gap] Codex skill wrappers do not yet exist for the standard review workflows,
  so slash prompt bodies are currently doing workflow-routing work.
- [gap] Live Claude review does not yet have a product-level repo-read consent
  flow for allow once, always allow for this repository, or cancel.
- [existing] A Codex `Stop` hook exists as an optional review gate, but is not
  part of the default install path.
- [existing] CI runs lint, syntax checks, and npm package dry-run checks across
  Node 18, 20, and 22.

### Active

<!-- Current scope. Building toward these. -->

- [ ] Make "Codex-first replacement workflow for codex-plugin-cc" the primary
  v1 team positioning.
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
- [ ] Move the team-facing Claude review UX from slash prompt wrappers to Codex
  skills that call the MCP tools directly.
- [ ] Add explicit Claude repo-read consent so users control whether Claude
  Code may read repo diffs, related files, and selected planning docs.

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Automatic Claude review by default - team rollout should avoid surprise usage
  cost and Codex/Claude stop loops.
- Hook-first onboarding - hooks are useful later, but manual skill or MCP
  invocation is the safer first learning path.
- Cloud service or hosted queue - the project is local-first and depends on the
  user's local Claude Code authentication.
- Replacing GSD/gstack planning, validation, review, or shipping workflows - this
  project is a model bridge, not a process framework.
- Replacing Codex's own planning or review - Claude is a second opinion, not the
  primary orchestrator.
- Building a GitHub PR review bot - that is a different hosted/automation
  product shape.
- Claiming full Codex chat-context transfer - v1 should pass explicit artifacts
  and focus, not imply invisible context sharing.
- Broad public plugin-marketplace polish - team usability comes before a wider
  Codex-user growth goal.
- Write-enabled rescue as a normal workflow - write access remains exceptional
  because it bypasses the default read-only safety boundary.

## Context

This project started from the idea of replacing the need for `codex-plugin-cc`
in a Codex-first workflow. The useful mirror is not just "call another CLI"; it
is letting Codex users keep one primary workspace while asking Claude Code for
the kind of perspective the current Codex context may miss.

The team's first need is not an always-on auto-reviewer. Team members use Codex
in different ways, and not everyone will have the same comfort level with hooks
or multi-agent review loops. The rollout should therefore make the manual path
feel obvious: ask for a design review when the plan feels consequential, risky,
or too self-confirming. After testing slash prompts in Codex App, the better
v2 surface is Codex skills: they keep workflow instructions out of the visible
chat transcript and match how GSD/gstack commands are already used.

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
- **Workflow**: Manual MCP invocation and Codex skills are the standard rollout
  path; slash prompts are compatibility wrappers only if retained, and hooks
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
| Support MCP tools plus Codex skills as the standard surface | MCP gives capability; skills give workflow and learnable team UX without exposing long prompt bodies. | - Pending |
| Treat slash prompts as optional compatibility aliases | Slash prompts helped v1 discovery but are awkward when their bodies appear in chat. | - Pending |
| Position as a Codex-first replacement workflow for codex-plugin-cc | Otherwise the project reads like a duplicate review skill instead of a clear workspace choice. | - Pending |
| Keep GSD/gstack as an adjacent workflow layer | GSD owns process state; this plugin owns the Codex-to-Claude bridge. | - Pending |
| Keep hooks opt-in | Automatic review can loop and consume usage unexpectedly. | - Pending |
| Center v1 on design critique and implementation-risk detection | This is the distinct "other model perspective" value the team asked for. | - Pending |
| Pass explicit artifacts rather than pretending to share full Codex context | Claude Code sees what we provide through repo state, diff, docs, and prompt focus. | - Pending |
| Extract core state before broad feature growth | The current monolithic server makes status/result/cancel behavior hard to test. | - Pending |
| Track stable GSD planning docs but ignore runtime state | Codebase maps should be reviewable; logs, locks, and active runtime markers should stay local. | - Pending |
| Add explicit repo-read consent before live Claude review | Users should control when Claude Code may read repo diffs, related files, and selected planning docs. | - Pending |

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
*Last updated: 2026-06-09 after Codex-first positioning clarification*
