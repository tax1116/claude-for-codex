---
quick_id: 260611-drd
status: planned
created_at: "2026-06-11T00:54:27Z"
---

# Quick Task: Record v2 skill-surface and consent scope

## Goal

Capture the v2 product decision that team-facing Claude review workflows should
move from long slash prompt wrappers to Codex skills, and that live Claude
review should be gated by explicit repo-read consent.

## Scope

- Update v2 requirements with Codex skill-surface requirements.
- Update v2 requirements with Claude repo-read consent requirements.
- Promote a Phase 4 candidate in the roadmap for skill-based UX and consent.
- Update project state and decisions so future planning does not treat slash
  prompts as the canonical team surface.

## Verification

- `git diff --check`
- Manual read-through of changed planning docs
