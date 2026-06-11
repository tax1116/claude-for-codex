# Requirements: claude-for-codex

**Defined:** 2026-06-10
**Milestone:** v2.0 Explicit Claude Follow-Up
**Core Value:** Codex-first users can keep Codex as the task owner while calling Claude Code as a local second-opinion bridge for design critique, implementation-risk review, and recovery.

## v2.0 Requirements

Requirements for the explicit Claude follow-up workflow. v1.0 requirements are
archived in `.planning/milestones/v1.0-REQUIREMENTS.md`.

### Follow-Up

- [ ] **FOL-01**: User can ask a follow-up question about a previous Claude review result through an explicit MCP tool or documented slash-command pattern.
- [ ] **FOL-02**: User can choose to continue the latest Claude session when a latest session id exists for the current repo.
- [ ] **FOL-03**: User can choose to continue a specific Claude session by supplying a session id.
- [ ] **FOL-04**: User can choose to start fresh when session continuity would create the wrong context.
- [ ] **FOL-05**: Follow-up output clearly states which session mode was used: latest, specific, or fresh.

### Context

- [ ] **CTX-05**: Follow-up prompts distinguish Claude session continuity from Codex chat-context transfer.
- [ ] **CTX-06**: Follow-up prompts include the prior Claude result or job id context explicitly enough that Claude can answer without assuming invisible Codex context.
- [ ] **CTX-07**: Follow-up docs explain when to use follow-up versus a fresh review.

### Safety

- [ ] **SAFE-06**: Follow-up review remains read-only by default with the same read-style tool restrictions as review/adversarial review.
- [ ] **SAFE-07**: Follow-up cannot silently cross into write-capable rescue behavior.

### Quality

- [ ] **QUAL-07**: Tests cover follow-up prompt construction for latest, specific, and fresh session modes.
- [ ] **QUAL-08**: Tests cover missing latest-session diagnostics and invalid explicit session input.
- [ ] **QUAL-09**: Tests cover follow-up result persistence and status/result compatibility with existing job flows.

### Docs

- [ ] **DOC-06**: README and setup docs include examples for follow-up after a foreground review result.
- [ ] **DOC-07**: README and setup docs include examples for follow-up after a background review result using task/result context.
- [ ] **DOC-08**: Docs describe the session-mode tradeoff in operator language: continue latest, continue specific, or start fresh.

## Future Requirements

Deferred beyond the explicit follow-up milestone.

### Diagnostics

- **DIAG-01**: User receives structured diagnosis for Claude launch failure, auth failure, malformed JSON output, timeout, and likely context exhaustion.
- **DIAG-02**: User receives guidance to narrow large reviews by base ref, focus, file scope, or background execution.
- **DIAG-03**: Stale running jobs are marked clearly when the MCP server can no longer control the child process.

### Hooks

- **HOOK-01**: User can enable the optional Codex `Stop` review hook with clear setup and rollback instructions.
- **HOOK-02**: Hook behavior is covered by tests for allow, block, malformed output, timeout, and launch failure.
- **HOOK-03**: Hook and MCP review prompts either share tested policy or intentionally document why they differ.

### Release

- **REL-01**: User can install from a packed npm tarball and run a smoke check.
- **REL-02**: Release docs are revalidated against current OpenAI Codex, Anthropic Claude Code, and MCP documentation.
- **REL-03**: Public distribution docs include support boundaries and known local-first limitations.

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Automatic Claude follow-up after every review | Follow-up should be intentional so users control context, latency, and usage. |
| Hidden Codex chat-context transfer | Claude only receives explicit artifacts and repo access; implying hidden context transfer creates false confidence. |
| Write-enabled follow-up as a normal workflow | Follow-up is review-oriented and should inherit read-only defaults; rescue remains a separate explicit path. |
| Hosted queue or cloud service | The product remains local-first and depends on local Claude Code authentication. |
| Hook-first onboarding | Hooks are advanced automation; manual slash commands stay the team standard path. |
| GitHub PR review bot | Hosted PR automation is a separate product shape with different auth, tenancy, and review-posting concerns. |
| Public marketplace polish before team validation | Internal reliability and docs come before broad distribution. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOL-01 | Phase 1 | Planned |
| FOL-02 | Phase 1 | Planned |
| FOL-03 | Phase 1 | Planned |
| FOL-04 | Phase 1 | Planned |
| FOL-05 | Phase 1 | Planned |
| CTX-05 | Phase 1 | Planned |
| CTX-06 | Phase 1 | Planned |
| CTX-07 | Phase 1 | Planned |
| SAFE-06 | Phase 1 | Planned |
| SAFE-07 | Phase 1 | Planned |
| QUAL-07 | Phase 1 | Planned |
| QUAL-08 | Phase 1 | Planned |
| QUAL-09 | Phase 1 | Planned |
| DOC-06 | Phase 1 | Planned |
| DOC-07 | Phase 1 | Planned |
| DOC-08 | Phase 1 | Planned |

**Coverage:**
- v2.0 requirements: 16 total
- Mapped to phases: 16
- Unmapped: 0

---
*Requirements defined: 2026-06-10 for v2.0 explicit Claude follow-up*
