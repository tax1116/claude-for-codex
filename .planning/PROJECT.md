# claude-for-codex

## What This Is

`claude-for-codex` is a local MCP plugin for Codex-first teams that want the
`codex-plugin-cc` workflow in the opposite primary workspace. Instead of moving
from Codex into Claude Code to get a second opinion, users keep Codex as the
main working surface and call Claude Code deliberately for review, adversarial
critique, rescue, background status, results, and cancellation.

The first team rollout is not automatic review. The standard path is manual:
use a slash command or MCP tool when Codex's current context may be too narrow
and a separate design/risk review would help.

## Core Value

Codex-first users can keep Codex as the task owner while calling Claude Code as a
local second-opinion bridge for design critique, implementation-risk review, and
recovery.

## Current Milestone: v2.0 Explicit Claude Follow-Up

**Goal:** Users can explicitly ask follow-up questions about prior Claude review
results while choosing whether to continue a Claude session or start fresh.

**Target features:**
- A manual follow-up workflow that references a previous Claude result.
- Explicit session choice: latest session, specific session, or fresh review.
- Documentation that separates Claude session continuity from Codex chat-context
  transfer.

## Requirements

### Validated

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
- [v1.0] The product is positioned as a Codex-first replacement workflow for the
  `codex-plugin-cc` idea.
- [v1.0] Users can use both MCP tools and slash commands, with slash commands
  documented as the standard team rollout path.
- [v1.0] Read-only review prompts center on design critique and
  implementation-risk detection.
- [v1.0] Review input is grounded in repo state, diff, planning docs, and an
  optional user focus rather than implied full Codex chat transfer.
- [v1.0] The job, runner, status, result, cancel, and package contracts are
  covered by deterministic local checks.
- [v1.0] Hooks remain opt-in and reversible, and write-capable rescue remains
  outside the default review path.

### Active

<!-- Current scope. Building toward these. -->

- [ ] Add an explicit Claude follow-up workflow that can ask about a previous
  Claude review result.
- [ ] Let users choose whether the follow-up continues the latest Claude session,
  continues a specific Claude session, or starts fresh.
- [ ] Preserve read-only defaults for follow-up review unless the user explicitly
  chooses an existing write-capable rescue path.
- [ ] Document the practical difference between Claude session continuity and
  Codex chat-context transfer.
- [ ] Add deterministic tests for follow-up prompt construction, session
  selection, and missing-session diagnostics.

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Automatic Claude review by default - team rollout should avoid surprise usage
  cost and Codex/Claude stop loops.
- Hook-first onboarding - hooks are useful later, but manual invocation is the
  safer first learning path.
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
- Automatic follow-up after every review - follow-up remains manual so users
  control context, latency, and usage.

## Context

This project started from the idea of replacing the need for `codex-plugin-cc`
in a Codex-first workflow. The useful mirror is not just "call another CLI"; it
is letting Codex users keep one primary workspace while asking Claude Code for
the kind of perspective the current Codex context may miss.

The team's first need is not an always-on auto-reviewer. Team members use Codex
in different ways, and not everyone will have the same comfort level with hooks
or multi-agent review loops. The rollout should therefore make the manual path
feel obvious: ask for a design review when the plan feels consequential, risky,
or too self-confirming.

The v1.0 MVP shipped a usable manual review bridge, async job controls, docs,
tests, and opt-in automation boundaries. A team can use the plugin from v1.0
for deliberate read-only Claude review; v2.0 improves the follow-up experience
rather than making first use possible. Historical v1 planning artifacts are
archived under `.planning/milestones/`.

The product promise still centers on two review lenses:

- Design critique: challenge architecture boundaries, complexity, assumptions,
  and simpler alternatives.
- Implementation-risk detection: surface missing tests, state-management risks,
  cancellation/resume edge cases, context-limit issues, and failure modes before
  implementation or merge.

The v2.0 milestone narrows the next improvement to explicit follow-up. The
plugin should let Codex ask Claude a second question about prior Claude output
without pretending that Claude can see the full Codex chat. Session continuity is
useful, but it must be a visible operator choice.

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
| Use Node.js for the MCP server | MCP SDK wiring and npm install are the simplest team path. | Delivered in v1.0 |
| Support both MCP tools and slash commands | MCP gives capability; slash commands give learnable team UX. | Delivered in v1.0 |
| Document slash commands as the team standard path | Team rollout should start from an easy manual command, not hidden tool invocation. | Delivered in v1.0 |
| Position as a Codex-first replacement workflow for codex-plugin-cc | Otherwise the project reads like a duplicate review skill instead of a clear workspace choice. | Delivered in v1.0 |
| Keep GSD/gstack as an adjacent workflow layer | GSD owns process state; this plugin owns the Codex-to-Claude bridge. | Delivered in v1.0 |
| Keep hooks opt-in | Automatic review can loop and consume usage unexpectedly. | Delivered in v1.0 |
| Center v1 on design critique and implementation-risk detection | This is the distinct "other model perspective" value the team asked for. | Delivered in v1.0 |
| Pass explicit artifacts rather than pretending to share full Codex context | Claude Code sees what we provide through repo state, diff, docs, and prompt focus. | Delivered in v1.0 |
| Extract core state before broad feature growth | The monolithic server needed testable state/result/cancel behavior first. | Delivered in v1.0 |
| Track stable GSD planning docs but ignore runtime state | Codebase maps should be reviewable; logs, locks, and active runtime markers should stay local. | Delivered in v1.0 |
| Make follow-up an explicit operator action | Session continuation can be useful but should not hide context, usage, or review intent. | Active in v2.0 |
| Keep session choice visible | Users need to know whether Claude is continuing latest, continuing a specific session, or starting fresh. | Active in v2.0 |

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
*Last updated: 2026-06-10 after v1.0 archive and v2.0 follow-up milestone start*
