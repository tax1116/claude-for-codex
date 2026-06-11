# claude-for-codex

## What This Is

`claude-for-codex` is a local MCP plugin for Codex-first teams that want the
`codex-plugin-cc` workflow in the opposite primary workspace. Codex stays the
main working surface, while Claude Code can be called deliberately for read-only
review, adversarial critique, rescue, background job status/result/cancel, and
repo-read-gated second opinions.

The v2.0 shipped surface makes Codex skills the standard team-facing workflow.
MCP tools remain the underlying capability and reference interface. Slash prompt
wrappers are compatibility aliases, not the primary rollout path. Hooks and
write-capable rescue remain optional, explicit, and outside default onboarding.

## Current State

**Shipped milestone:** v2.0 Skill-Based Review UX And Consent on 2026-06-11.

**Package state:** npm package version is `0.2.0`. Product milestone labels such
as v1/v2 are separate from npm stable release numbering; package releases remain
in `0.x.y` until the team workflow has survived real team use.

**Runtime shape:**

- Node.js ESM MCP server over stdio.
- Local Claude Code CLI dependency.
- File-backed repo-scoped state store.
- Package-owned Codex skills under `skills/*/SKILL.md`.
- Deterministic Node test suite with fake-Claude lifecycle coverage.

## Core Value

Codex-first users can keep Codex as the task owner while calling Claude Code as a
local second-opinion bridge for design critique, implementation-risk review, and
recovery.

## Requirements

### Validated

- [x] Codex can launch a local Node.js MCP server over stdio - v2.0.
- [x] The MCP server can invoke the local Claude Code CLI with
  `claude -p --output-format json` - v2.0.
- [x] Manual tools exist for setup, review, adversarial review, rescue, status,
  result, and cancellation - v2.0.
- [x] Claude review and adversarial review run read-only by default with a
  restricted file-read and read-style git allowlist - v2.0.
- [x] Background jobs are persisted in a repo-scoped file-backed store and can
  be listed, read, and cancelled while the MCP server owns the process - v2.0.
- [x] Setup, docs, and prompts explain that Claude receives explicit artifacts
  and repo reads, not the full hidden Codex chat context - v2.0.
- [x] Hook review stays advanced opt-in, reversible, and risk-labeled - v2.0.
- [x] `allow_write` rescue stays outside the standard review path and warns
  about broad write permissions - v2.0.
- [x] Codex skills are the standard team-facing review workflow surface -
  v2.0.
- [x] Repo-read consent supports allow once, always allow for this repository,
  cancel, inspect, and revoke - v2.0.
- [x] Package dry-run includes runtime, docs, prompts, hooks, and skills -
  v2.0.
- [x] Release-facing docs identify drift-prone external claims for release-date
  revalidation - v2.0.

### Active

No active requirements are defined after v2.0 close. Run `$gsd-new-milestone` to
define fresh requirements.

Candidate next areas:

- Explicit Claude follow-up/session choice workflow.
- Structured diagnosis for Claude launch failure, auth failure, malformed JSON,
  timeout, context exhaustion, and stale jobs.
- Optional hook setup tooling and hook behavior tests.
- Release smoke testing from a packed npm tarball.
- Public distribution support boundaries after internal team validation.

### Out of Scope

- Automatic Claude review by default - team rollout should avoid surprise usage
  cost and Codex/Claude stop loops.
- Hook-first onboarding - hooks are useful later, but skill or MCP invocation is
  the safer learning path.
- Cloud service or hosted queue - the project is local-first and depends on the
  user's local Claude Code authentication.
- Replacing GSD/gstack planning, validation, review, or shipping workflows -
  this project is a model bridge, not a process framework.
- Replacing Codex's own planning or review - Claude is a second opinion, not the
  primary orchestrator.
- Building a GitHub PR review bot - that is a different hosted/automation
  product shape.
- Claiming full Codex chat-context transfer - the bridge passes explicit
  artifacts and focus, not invisible conversation state.
- Write-enabled rescue as a normal workflow - write access remains exceptional
  because it bypasses the default read-only safety boundary.

## Context

The project began as a Codex-first mirror of `codex-plugin-cc`: not just "call
another CLI," but keep one primary workspace while asking Claude Code for a
different model perspective when Codex context may be too narrow.

The team does not want always-on auto-review as the default. Manual,
skill-first invocation is the standard path; hooks stay optional for users who
intentionally accept loop, blocking, and usage-cost risks.

The next product risk is not whether the bridge can call Claude. That is now
validated. The next risk is whether follow-up, diagnosis, release, and optional
automation workflows stay understandable as real teammates use the package.

## Constraints

- **Runtime**: Node.js MCP server, ESM `.mjs`, no TypeScript build.
- **Local dependency**: Claude Code must be installed and authenticated on the
  user's machine.
- **Safety**: Read-only review is default; write-capable rescue remains
  explicit and warned.
- **Workflow**: Codex skills and MCP tools are the supported team path; hooks
  are optional.
- **Distribution**: npm package contents are controlled by `package.json.files`.
- **Versioning**: Product milestones use v1/v2 labels; npm remains `0.x.y`
  before stable `1.0.0`.
- **Repository flow**: Development proceeds from `dev` feature branches, with
  protected `master` for stable history.
- **Legal**: The project is unofficial and must avoid implying affiliation with
  OpenAI or Anthropic.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use Node.js for the MCP server | MCP SDK wiring and npm install are the simplest team path. | Good - shipped in v2.0 |
| Support MCP tools plus Codex skills as the standard surface | MCP gives capability; skills give workflow and learnable team UX without exposing long prompt bodies. | Good - shipped in v2.0 |
| Treat slash prompts as optional compatibility aliases | Slash prompts helped v1 discovery but are awkward when their bodies appear in chat. | Good - shipped in v2.0 |
| Position as a Codex-first replacement workflow for codex-plugin-cc | Otherwise the project reads like a duplicate review skill instead of a clear workspace choice. | Good - validated in docs |
| Keep GSD/gstack as an adjacent workflow layer | GSD owns process state; this plugin owns the Codex-to-Claude bridge. | Good - preserved |
| Keep hooks opt-in | Automatic review can loop and consume usage unexpectedly. | Good - guarded in docs/source |
| Center review value on design critique and implementation-risk detection | This is the distinct "other model perspective" value the team asked for. | Good - shipped |
| Pass explicit artifacts rather than pretending to share full Codex context | Claude Code sees what we provide through repo state, diff, docs, and prompt focus. | Good - documented and tested |
| Extract core state before broad feature growth | The monolithic server made status/result/cancel behavior hard to test. | Good - runner and state modules shipped |
| Track stable GSD planning docs but ignore runtime state | Codebase maps should be reviewable; logs, locks, and active runtime markers stay local. | Good - kept |
| Add explicit repo-read consent before live Claude review | Users should control when Claude Code may read repo diffs, related files, and selected planning docs. | Good - shipped in v2.0 |
| Keep npm releases in 0.x.y until stable team use | "v1/v2" describe product milestones, not package version 1.0.0. | Good - documented |

## Evolution

This document evolves at phase transitions and milestone boundaries.

After v2.0, the next milestone should start from fresh requirements rather than
editing the archived v2.0 scope in place.

---
*Last updated: 2026-06-11 after v2.0 milestone completion*
