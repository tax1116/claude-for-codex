# Roadmap: claude-for-codex

## Milestones

- [x] **v2.0 Skill-Based Review UX And Consent** - Phases 1-4 shipped on
  2026-06-11. Full archive:
  [v2.0-ROADMAP.md](./milestones/v2.0-ROADMAP.md)

## Current Status

v2.0 is complete and archived. The product now provides a Codex-first local MCP
bridge to Claude Code with:

- Manual read-only review and adversarial critique.
- Background job status, result, and cancellation.
- Explicit hook and write-capable rescue safety boundaries.
- Codex skill wrappers for the standard team workflow.
- Repo-read consent with allow-once, repo-level allow, inspect, and revoke.

No active milestone is currently planned in this file. Start the next milestone
with `$gsd-new-milestone`, which will create fresh requirements and roadmap
scope.

## Completed Phases

<details>
<summary>v2.0 Skill-Based Review UX And Consent (Phases 1-4) - SHIPPED 2026-06-11</summary>

- [x] Phase 1: Manual Design/Risk Review Core (2/2 plans) - completed
  2026-06-08.
- [x] Phase 2: Async Job Reliability And Testable Packaging (2/2 plans) -
  completed 2026-06-09.
- [x] Phase 3: Opt-In Automation Boundaries And Release Revalidation (2/2
  plans) - completed 2026-06-10.
- [x] Phase 4: Skill-Based Review UX And Claude Repo-Read Consent (2/2 plans) -
  completed 2026-06-11.

</details>

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Manual Design/Risk Review Core | v2.0 | 2/2 | Complete | 2026-06-08 |
| 2. Async Job Reliability And Testable Packaging | v2.0 | 2/2 | Complete | 2026-06-09 |
| 3. Opt-In Automation Boundaries And Release Revalidation | v2.0 | 2/2 | Complete | 2026-06-10 |
| 4. Skill-Based Review UX And Claude Repo-Read Consent | v2.0 | 2/2 | Complete | 2026-06-11 |

## Next Milestone Candidates

These are candidates only. They should become real requirements through
`$gsd-new-milestone`.

- Explicit Claude follow-up/session workflow.
- Structured diagnostics for auth, launch, malformed output, timeout, context
  exhaustion, and stale jobs.
- Optional hook behavior tests and setup tooling.
- Release smoke testing from a packed npm tarball and public support-boundary
  docs.
