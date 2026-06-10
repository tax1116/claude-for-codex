# Retrospective: claude-for-codex

## v1.0 MVP

**Completed:** 2026-06-10

### What Worked

- Manual-first positioning kept the project distinct from generic review skills
  and from automatic PR review bots.
- Keeping slash commands as the team-facing path made the rollout easier to
  explain while preserving MCP tools as the capability surface.
- Deterministic fake-Claude tests made job, runner, status, result, and cancel
  behavior reviewable without requiring a live Claude account.
- Release-facing docs now call out time-sensitive claims so later publication
  work has a clear revalidation checklist.

### What To Improve

- Follow-up behavior needs a first-class workflow so users can continue a Claude
  conversation intentionally rather than inferring behavior from session ids.
- Diagnostics should become more structured after follow-up so token/context,
  auth, timeout, malformed JSON, and stale process cases are easier to explain.
- Hook automation should stay separate from default onboarding until its policy
  and tests are explicit enough for team use.

### Cross-Milestone Trends

- Product value is strongest when Codex remains the owner and Claude is a
  deliberate second-opinion reviewer.
- Context boundaries must be visible in both prompts and docs; invisible context
  transfer claims would create false confidence.
- Every new runtime feature should come with fake-Claude coverage before it is
  described as team-ready.
