---
quick_id: 260610-k82
slug: resolve-phase-2-external-claude-review-b
created: 2026-06-10T05:33:40Z
status: planned
---

# Quick Task: Resolve Phase 2 External Claude Review Blocker

## Goal

Clear the recorded Phase 2 cross-AI review blocker after explicit user approval
to send Phase 2 planning, requirements, validation, runtime, tests, and docs
context to the external Claude service for read-only review.

## Tasks

1. Verify Claude Code CLI auth status outside the sandbox.
2. Run a read-only external Claude review for Phase 2 artifacts and runtime
   evidence.
3. Record the review verdict, findings, execution metadata, and blocker status
   in the Phase 2 review artifact.
4. Address any small actionable review findings that are clearly valid.
5. Update project state so remaining work reflects PR/release flow instead of
   the old blocker.
6. Run targeted and full verification.

## Acceptance

- `02-REVIEWS.md` no longer says the Phase 2 external review is blocked.
- Any accepted review finding has code/test/doc evidence.
- `STATE.md` no longer lists the Phase 2 external review as a blocker.
- Verification passes.
