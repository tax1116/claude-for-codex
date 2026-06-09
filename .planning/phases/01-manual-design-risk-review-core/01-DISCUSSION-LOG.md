# Phase 1: Manual Design/Risk Review Core - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-08
**Phase:** 1-Manual Design/Risk Review Core
**Areas discussed:** Slash command contract, Explicit context contract, Read-only safety boundary, Setup and result shape

---

## Slash Command Contract

| Question | Option | Description | Selected |
|----------|--------|-------------|----------|
| Standard team commands | Two primary commands | `/claude-review` handles implementation-risk review and `/claude-adversarial` handles design critique. | Yes |
| Standard team commands | One command with mode | Use one command with a mode flag such as risk/design. | |
| Standard team commands | MCP tools first | Make MCP tool usage the main documented path. | |
| Default input | Minimal with optional focus/base | Commands run with no required arguments, with optional narrowing inputs. | Yes |
| Default input | Require focus | Always require a user focus. | |
| Default input | Require base and focus | Always require both a comparison base and a focus. | |
| Result shape | Prioritized findings only | Return concrete prioritized findings instead of broad narrative. | Yes |
| Result shape | Findings plus recommendation | Add a go/revise/block-style recommendation. | |
| Result shape | Narrative critique | Return Claude's longer analysis directly. | |
| Docs relationship | Slash commands first, MCP tools as reference | Teach slash commands as rollout path and document MCP tools underneath. | Yes |
| Docs relationship | Equal weight | Explain slash commands and MCP tools side by side. | |
| Docs relationship | MCP tool docs only | Treat slash commands as examples only. | |

**User's choice:** Two primary commands; minimal optional input; prioritized findings; slash commands first.
**Notes:** The team rollout should optimize for learnability without hiding the underlying MCP capability.

---

## Explicit Context Contract

| Question | Option | Description | Selected |
|----------|--------|-------------|----------|
| Context inputs | Repo state + diff + planning docs + focus/base | Claude sees explicit repo state, comparison, selected docs, and user focus. | Yes |
| Context inputs | Diff-first only | Keep context mostly to tracked/staged changes. | |
| Context inputs | Planning-docs-first | Prioritize planning docs over diff inspection. | |
| Untracked files | Always inspect git status and mention relevant untracked files | Avoid missing newly created files. | Yes |
| Untracked files | Tracked diff only by default | Keep review range more predictable. | |
| Untracked files | User must opt in to untracked | Require explicit include flag. | |
| Planning docs | Selected GSD docs for current phase | Use project, requirements, roadmap, phase context, and plan when available. | Yes |
| Planning docs | All `.planning/**` docs | Let Claude inspect all planning artifacts. | |
| Planning docs | Only user-specified docs | Require the user to specify each doc. | |
| Resume semantics | Claude session continuity only | Resume does not transfer full Codex chat context. | Yes |
| Resume semantics | Avoid resume in Phase 1 | Prefer fresh reviews only. | |
| Resume semantics | Treat resume as follow-up | Present resume as a generic follow-up path. | |

**User's choice:** Explicit repo/context inputs, untracked awareness, selected current-phase docs, and Claude-session-only resume semantics.
**Notes:** False context sharing is a core product risk; docs and prompts must be precise.

---

## Read-Only Safety Boundary

| Question | Option | Description | Selected |
|----------|--------|-------------|----------|
| Tool scope | Read + grep/glob + read-style git only | Allow file reads/search and `git status/diff/log/show`. | Yes |
| Tool scope | Read-style shell commands more broadly | Allow broader read/verification shell commands. | |
| Tool scope | No shell, file reads only | Avoid shell access entirely. | |
| Rescue/write docs | Mention as out-of-default, warned escape hatch | Do not hide rescue, but keep it outside the standard review path. | Yes |
| Rescue/write docs | Do not document rescue in Phase 1 | Remove rescue from Phase 1 user docs. | |
| Rescue/write docs | Document rescue alongside review | Present rescue as peer workflow. | |
| Safety note | Explicit no-edit statement | Say Claude review is read-only and no files were edited. | Yes |
| Safety note | Only document it once in README | Avoid repeated output text. | |
| Safety note | No repeated safety text | Trust tool restrictions without output reminders. | |
| Hooks | Out of default onboarding, opt-in docs only | Document loop, cost, and blocking risks for advanced users. | Yes |
| Hooks | Mention but no setup instructions | Note hook existence only. | |
| Hooks | Include hook setup in Phase 1 docs | Make hooks usable during Phase 1. | |

**User's choice:** Strict read-only review boundary, warned rescue escape hatch, no-edit output statement, and hooks outside default onboarding.
**Notes:** Phase 1 should build trust before automation.

---

## Setup And Result Shape

| Question | Option | Description | Selected |
|----------|--------|-------------|----------|
| Setup diagnostics | Claude binary + auth reachability + timeout guidance | Diagnose the common local setup blockers. | Yes |
| Setup diagnostics | Binary only | Check only whether `claude` exists. | |
| Setup diagnostics | Full live Claude smoke | Call live Claude as the setup proof. | |
| Severity labels | High / Medium / Low | Use human-readable finding severity. | Yes |
| Severity labels | P0 / P1 / P2 | Use engineering incident-style priority labels. | |
| Severity labels | Blocker / Warning / Info | Use gate-like labels. | |
| Empty results | No findings plus caveats | Say no high-confidence findings and describe scope/limits. | Yes |
| Empty results | Clean pass | Use a simple looks-good message. | |
| Empty results | Always include suggestions | Add improvement ideas even without findings. | |
| Failure output | Actionable failure categories | Categorize missing binary, auth/reachability, timeout, malformed output, and context-size risks. | Yes |
| Failure output | Raw error passthrough | Show Claude output almost directly. | |
| Failure output | Generic failure message | Show a simple failure. | |

**User's choice:** Actionable setup/failure output, `High/Medium/Low` findings, and no-findings caveats.
**Notes:** Failure output should reduce team support load during rollout.

---

## the agent's Discretion

No behavior-level decisions were delegated to the agent. Implementation details remain for planning.

## Deferred Ideas

None.
