---
status: complete
phase: 04-skill-based-review-ux-and-claude-repo-read-consent
source:
  - 04-01-SUMMARY.md
  - 04-02-SUMMARY.md
started: 2026-06-11T04:34:18Z
updated: 2026-06-11T04:54:13Z
---

## Current Test

[testing complete]

## Tests

### 1. Skill Setup And Discovery Guidance
expected: Running or asking for `claude_setup` should make the setup path clear: it reports the expected Codex skill files under `~/.codex/skills`, names `$claude-review`, `$claude-adversarial`, `$claude-rescue`, and `$claude-setup`, and shows the copy/install guidance when those skill files are missing.
result: pass

### 2. Skill-First Review Surface
expected: `$claude-review` is the standard team workflow surface. It should behave like a thin launcher for `claude.claude_review` and should not paste a long internal slash-command prompt body into the chat.
result: pass

### 3. Repo-Read Consent Gate
expected: Before a live Claude review, adversarial review, or rescue starts without prior repo approval, the user sees the repo-read consent boundary and can choose allow once, always allow for this repository, or cancel.
result: pass

### 4. Consent Inspect And Revoke
expected: Repository-level Claude repo-read consent can be inspected with `claude_consent_status` and revoked with `claude_consent_revoke` without hand-editing state files.
result: pass

### 5. Rescue Write Boundary
expected: `$claude-rescue` shares the repo-read consent path, but `allow_write: true` remains a separate, explicitly warned write-capable escape hatch and is not implied by repo-read consent.
result: pass

## Summary

total: 5
passed: 5
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

[none yet]
