---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: Skill-Based Review UX And Consent
status: planning
stopped_at: Phase 4 planned with skill-surface and repo-read consent execution slices
last_updated: "2026-06-11T02:55:32Z"
last_activity: 2026-06-11 - Planned Phase 4 as two executable slices: Codex skill surface and repo-read consent gate.
progress:
  total_phases: 4
  completed_phases: 3
  total_plans: 8
  completed_plans: 6
  percent: 75
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-08)

**Core value:** Codex-first users can keep Codex as the task owner while calling Claude Code as a local second-opinion bridge for design critique, implementation-risk review, and recovery.
**Current focus:** Plan v2 skill-based review UX and Claude repo-read consent

## Current Position

Phase: 4 (Skill-Based Review UX And Claude Repo-Read Consent)
Plan: 04-01 Codex Skill Surface And Compatibility Aliases ready for execution
Status: Phase 4 planned; execution can start with 04-01
Last activity: 2026-06-11 - Created Phase 4 CONTEXT/RESEARCH/PATTERNS/VALIDATION and plans 04-01, 04-02.

Progress: [########--] 75%

## Phase Progress

| Phase | Status | Requirements | Plans |
|-------|--------|--------------|-------|
| 1. Manual Design/Risk Review Core | Complete | 19 | 2/2 |
| 2. Async Job Reliability And Testable Packaging | Complete | 12 | 2/2 |
| 3. Opt-In Automation Boundaries And Release Revalidation | Complete | 4 | 2/2 |
| 4. Skill-Based Review UX And Claude Repo-Read Consent | Planned | 8 | 0/2 |

## Performance Metrics

**Velocity:**

- Total plans completed: 6
- Average duration: 8.0 min
- Total execution time: 0.5 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Manual Design/Risk Review Core | 2/2 | 0.2h | 4.5 min |
| 2. Async Job Reliability And Testable Packaging | 2/2 | 0.4h | 11.5 min |
| 3. Opt-In Automation Boundaries And Release Revalidation | 2/2 | 0.4h | 11.0 min |

**Recent Trend:**

- Last 5 plans: 01-02 Slash-Command Team Rollout (4 min), 02-01 Fake-Claude Job Lifecycle Contracts (15 min), 02-02 Package And Background Workflow Documentation (8 min), 03-01 Hook And Rescue Safety Boundaries (12 min), 03-02 Release Revalidation Markers (10 min)
- Trend: All planned v1 phases are implemented, the prior Phase 2 external-review blocker is cleared, `dev` has been promoted to `master`, and release-facing docs were revalidated for the 2026-06-10 release pass.

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Phase 1 centers the MVP on manual slash-command-first design critique and implementation-risk review.
- Hooks remain opt-in, reversible, and outside the default launch path.
- Write-enabled rescue remains outside the v1 default review path.
- Deterministic fake-Claude tests now cover background job and runner behavior without live Claude usage.
- Phase 3 preserves Codex-first positioning while keeping automation and write access explicitly guarded.
- v2 should move the team-facing review UX from slash prompt wrappers to Codex
  skills.
- v2 should add explicit Claude repo-read consent with allow once, always allow
  for this repository, and cancel choices.
- Package releases should follow Semantic Versioning, but stay in `0.x.y` until
  install, skill review, repo-read consent, cancellation, docs, CI, and package
  contents have survived real team use.
- Phase 4 should execute as two slices: first the Codex skill surface and
  compatibility aliases, then the shared repo-read consent gate.

### Pending Todos

- Execute Phase 4 plan 04-01: Codex Skill Surface And Compatibility Aliases.
- Execute Phase 4 plan 04-02 after 04-01: Repo-Read Consent Gate And Shared Policy.
- Repeat release-date revalidation before any later npm publish, release tag, or team rollout.

### Blockers/Concerns

- Release-date revalidation is current as of 2026-06-10; repeat it before later release-facing claims are treated as current.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260609-krv | Reposition product docs around Codex-first replacement workflow for codex-plugin-cc | 2026-06-09 | same commit | [260609-krv-reposition-product-docs-around-codex-fir](./quick/260609-krv-reposition-product-docs-around-codex-fir/) |
| 260610-k82 | Resolve Phase 2 external Claude review blocker | 2026-06-10 | same commit | [260610-k82-resolve-phase-2-external-claude-review-b](./quick/260610-k82-resolve-phase-2-external-claude-review-b/) |
| 260610-kmg | Update planning state after PR #11 merge and PR #4 promotion readiness | 2026-06-10 | same commit | [260610-kmg-update-planning-state-after-pr-11-merge-](./quick/260610-kmg-update-planning-state-after-pr-11-merge-/) |
| 260610-ukb | Refresh release-facing setup and hook documentation after master promotion | 2026-06-10 | same commit | [260610-ukb-refresh-release-facing-setup-and-hook-do](./quick/260610-ukb-refresh-release-facing-setup-and-hook-do/) |
| 260610-ur4 | Update planning state after PR #13 merge | 2026-06-10 | same commit | [260610-ur4-update-planning-state-after-pr-13-merge](./quick/260610-ur4-update-planning-state-after-pr-13-merge/) |
| 260610-uzt | Sync master squash promotion back into dev and document merge method | 2026-06-10 | same commit | [260610-uzt-sync-master-squash-promotion-back-into-d](./quick/260610-uzt-sync-master-squash-promotion-back-into-d/) |
| 260611-drd | Record v2 scope decision to move Claude review UX to Codex skills and add repo-read consent | 2026-06-11 | same commit | [260611-drd-record-v2-scope-decision-to-move-team-fa](./quick/260611-drd-record-v2-scope-decision-to-move-team-fa/) |
| 260611-vrs | Document SemVer policy for pre-1.0 team rollout releases | 2026-06-11 | same commit | [260611-vrs-document-semver-policy-for-pre-1-0-team](./quick/260611-vrs-document-semver-policy-for-pre-1-0-team/) |

## Deferred Items

Items acknowledged and carried forward from previous milestone close:

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| v2 Follow-Up | Explicit follow-up tool/session choice remains outside MVP roadmap. | Deferred | Initial roadmap |
| v2 Diagnostics | Structured diagnosis beyond MVP setup output and docs remains outside MVP roadmap. | Deferred | Initial roadmap |
| v2 Hooks | Hook setup tooling and hook-specific automated gates remain outside default MVP path. | Deferred | Initial roadmap |
| v2 Release | Public distribution polish beyond MVP package checks and revalidation markers remains outside MVP roadmap. | Deferred | Initial roadmap |
| v2 Skill Surface | Codex skills should become the standard team-facing review workflow, replacing long slash prompt bodies. | Promoted to Phase 4 candidate | 2026-06-11 |
| v2 Consent | Claude repo-read consent should gate live review with allow once, repo allow, and cancel choices. | Promoted to Phase 4 candidate | 2026-06-11 |

## Session Continuity

Last session: 2026-06-11T00:54:27Z
Stopped at: Phase 4 planned with two executable plans
Resume file: .planning/STATE.md

## Next Action

Run `$gsd-execute-phase 4` to start with `04-01-PLAN.md`, or explicitly execute
`04-01` if you want to keep the skill surface PR separate from consent gating.
