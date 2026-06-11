# Project Milestones: claude-for-codex

## v2.0 Skill-Based Review UX And Consent (Shipped: 2026-06-11)

**Delivered:** A Codex-first local Claude Code bridge with skill-based review
workflows, async job controls, explicit repo-read consent, and guarded automation
boundaries.

**Phases completed:** 1-4 (8 plans total)

**Key accomplishments:**

- Shipped read-only Claude review and adversarial critique with explicit Codex
  context, severity/output rules, base/focus narrowing, and setup diagnostics.
- Added deterministic fake-Claude lifecycle coverage for background status,
  result, cancellation, JSON/text output handling, timeouts, and missing binary
  guidance.
- Documented hook and write-capable rescue boundaries so automation and
  `allow_write` stay opt-in and outside default onboarding.
- Moved the team-facing workflow to Codex skills while keeping MCP tools as the
  reference interface and slash prompts as compatibility aliases.
- Added repo-read consent with allow once, always allow for this repository,
  cancel, inspect, and revoke.

**Stats:**

- 108 files changed since initial scaffold.
- 14,389 inserted lines across code, tests, docs, and planning artifacts.
- 4 phases, 8 plans, 43 verified milestone requirements.
- 2026-06-08 to 2026-06-11.

**Git range:** `a5b7217` -> `5866c1b`

**Archive:**

- [v2.0 roadmap](./milestones/v2.0-ROADMAP.md)
- [v2.0 requirements](./milestones/v2.0-REQUIREMENTS.md)
- [v2.0 audit](./milestones/v2.0-MILESTONE-AUDIT.md)

**What's next:** review/ship this branch, then define the next milestone with
`$gsd-new-milestone`.

---
