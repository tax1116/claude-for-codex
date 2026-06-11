---
phase: 04
slug: skill-based-review-ux-and-claude-repo-read-consent
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-06-11
---

# Phase 4 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

## Test Infrastructure

| Property | Value |
|----------|-------|
| Framework | Node built-in test runner |
| Config file | `package.json` scripts and `eslint.config.js` |
| Quick run command | `npm test` |
| Full suite command | `npm run ci` |
| Estimated runtime | ~5 seconds locally |

## Sampling Rate

- After every task commit: run `npm test` when runtime or docs contracts change.
- After every plan wave: run `npm run ci`.
- Before `$gsd-verify-work`: full suite must be green.
- Max feedback latency: 30 seconds for local checks.

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | SKILL-01, SKILL-02, SKILL-03, SKILL-04 | TM-26 | Skills are packaged and standard UX, slash prompts are compatibility only. | docs/package | `npm test` | W0 | pending |
| 04-01-02 | 01 | 1 | SKILL-01, SKILL-02, SKILL-03 | TM-26 | Skill files are thin launchers and do not duplicate full MCP review policy. | docs/source | `npm test` | W0 | pending |
| 04-01-03 | 01 | 1 | SKILL-04 | TM-27 | Setup reports missing skills and install path. | source/docs | `npm test` | W0 | pending |
| 04-02-01 | 02 | 2 | CONSENT-01, CONSENT-02, CONSENT-03 | TM-28 | Repo-level consent persists and revokes. | unit | `npm test` | W0 | pending |
| 04-02-02 | 02 | 2 | CONSENT-01, CONSENT-02, CONSENT-04 | TM-28, TM-29 | Claude process does not start without consent. | fake process | `npm test` | W0 | pending |
| 04-02-03 | 02 | 2 | CONSENT-04 | TM-30 | Repo-read consent remains separate from `allow_write`. | source/runtime | `npm test` | W0 | pending |
| 04-02-04 | 02 | 2 | CONSENT-01, CONSENT-02, CONSENT-03, CONSENT-04 | TM-28 | Docs teach allow once, repo allow, cancel, inspect, and revoke. | docs/package | `npm run ci` | W0 | pending |

## Wave 0 Requirements

Existing infrastructure covers all phase requirements:

- `test/docs-rollout-contract.test.mjs`
- `test/runtime-contract.test.mjs`
- `test/job-lifecycle.test.mjs`
- `test/state-store.test.mjs`
- `npm run ci`
- `npm run pack:check`

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
| --- | --- | --- | --- |
| Skill invocation appears inside a user's Codex App or CLI skill surface | SKILL-01 | The repo can package skill files, but local Codex skill discovery depends on the user's installation path and running session. | Copy `skills/*` to `~/.codex/skills/`, start a fresh Codex session if needed, and verify `$claude-review` / `$claude-setup` appear. |
| Live Claude review after consent | CONSENT-01, CONSENT-02 | CI must not require a real Claude account. | Run `claude_setup`, then `$claude-review`, choose allow once, and confirm Claude runs read-only. |

## Validation Sign-Off

- [x] All tasks have automated verification or a documented manual-only reason.
- [x] Sampling continuity has no 3 consecutive tasks without automated verify.
- [x] Wave 0 covers all missing references.
- [x] No watch-mode flags.
- [x] Feedback latency target is under 30 seconds locally.
- [x] `nyquist_compliant: true` set in frontmatter.

Approval: pending execution
