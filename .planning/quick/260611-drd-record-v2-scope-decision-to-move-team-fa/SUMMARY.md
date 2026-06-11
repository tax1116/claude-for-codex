---
quick_id: 260611-drd
status: complete
completed_at: "2026-06-11T00:54:27Z"
---

# Summary

Captured the v2 scope decision that Claude review should move to Codex skills
and that live Claude repo reads need an explicit consent gate.

## Changed

- Added `SKILL-*` v2 requirements for Codex skill wrappers, thin slash aliases,
  and setup diagnostics for missing skills.
- Added `CONSENT-*` v2 requirements for allow-once, repo-level allow, cancel,
  status, revoke, and shared repo-read consent policy.
- Added a Phase 4 candidate to the roadmap: Skill-Based Review UX And Claude
  Repo-Read Consent.
- Updated project state and key decisions so future planning treats skills as
  the standard team-facing workflow surface.

## Verification

- `git diff --check`
- Manual read-through of changed planning docs
