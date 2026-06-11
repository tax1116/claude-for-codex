# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into
future planning.*

## Milestone: v2.0 - Skill-Based Review UX And Consent

**Shipped:** 2026-06-11
**Phases:** 4 | **Plans:** 8 | **Sessions:** not separately tracked

### What Was Built

- Codex can call Claude Code through local MCP tools for setup, review,
  adversarial critique, rescue, status, result, and cancellation.
- Reviews are read-only by default and document the actual context Claude may
  inspect.
- Background Claude jobs are testable without live Claude credentials.
- Hook automation and write-capable rescue are documented as opt-in boundaries.
- Codex skills are the standard team workflow, with slash prompts kept as thin
  compatibility aliases.
- Repo-read consent gates live Claude review/rescue reads and supports inspect
  and revoke.

### What Worked

- Keeping the default workflow manual and skill-first preserved user trust while
  still allowing advanced hook and rescue paths.
- Fake-Claude tests made runner, job-store, status/result/cancel, and consent
  behavior verifiable without account or network dependence.
- GSD phase verification plus milestone audit caught lifecycle gaps before
  archive.

### What Was Inefficient

- PROJECT.md lagged behind shipped reality and needed a full milestone-close
  rewrite.
- Early slash-command wording exposed prompt internals in chat, which pushed the
  UX toward skills.
- The milestone audit initially failed on missing validation/verification
  artifacts even though the runtime work was already complete.

### Patterns Established

- Package-owned Codex skills should be thin launchers that call MCP tools; MCP
  owns policy and safety contracts.
- External Claude repo reads require explicit repo-read consent, separate from
  write permission.
- Release-facing docs should mark time-sensitive external-tool claims for
  release-date revalidation.
- Keep npm package SemVer separate from product milestone labels.

### Key Lessons

1. A second-model bridge needs a product boundary, not just a process wrapper.
2. Consent and safety language should be tested as docs/source contracts.
3. Lifecycle artifacts matter: audit, validation, verification, and state need
   to move together or GSD cannot truthfully close a milestone.

### Cost Observations

- Model mix: not measured in this repo.
- Sessions: not separately tracked.
- Notable: live Claude usage was avoided in CI; fake-Claude coverage carried the
  reliability work, with live checks left as release/team-rollout smoke tests.

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v2.0 | not tracked | 4 | Moved from slash-prompt-first review to skill-first MCP workflows with repo-read consent. |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v2.0 | 34 passing Node tests | Runtime, docs contracts, package contents, job lifecycle, state store, consent | No new runtime dependency beyond existing package stack. |

### Top Lessons

1. Manual opt-in review is the correct default for team trust.
2. Fake process tests are enough to validate local CLI orchestration without
   burning live account state.
3. Archive only after audit and validation artifacts agree with the roadmap and
   traceability table.
