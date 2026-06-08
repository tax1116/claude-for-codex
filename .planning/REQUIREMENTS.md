# Requirements: claude-for-codex

**Defined:** 2026-06-08
**Core Value:** Codex users can deliberately ask Claude Code for independent design critique and implementation-risk review before committing to a plan or change.

## v1 Requirements

Requirements for the first team rollout. Each maps to roadmap phases.

### Setup

- [ ] **SETUP-01**: User can install dependencies with npm on Node.js 18.18 or later.
- [ ] **SETUP-02**: User can register the MCP server in Codex using an absolute local path.
- [ ] **SETUP-03**: User can run a setup check that reports whether Claude Code is installed and reachable.
- [ ] **SETUP-04**: User can diagnose a missing Claude binary, unauthenticated Claude CLI, or timeout-prone MCP configuration from setup output and docs.

### Review

- [ ] **REV-01**: User can ask Claude for a read-only review of current Codex work from inside Codex.
- [ ] **REV-02**: User can ask Claude for an adversarial design critique focused on architecture boundaries, complexity, assumptions, and simpler alternatives.
- [ ] **REV-03**: User can ask Claude for implementation-risk detection focused on missing tests, state edge cases, cancellation/resume behavior, context limits, and failure modes.
- [ ] **REV-04**: User can specify a git base ref so Claude reviews the intended comparison range.
- [ ] **REV-05**: User can specify a focus area so Claude narrows the review to the user's current concern.
- [ ] **REV-06**: User receives review output that clearly prioritizes concrete findings and does not claim to have edited files.

### Context

- [ ] **CTX-01**: User can understand that Claude sees only explicit prompts, repo files it is allowed to read, read-style git state, selected planning artifacts, previous Claude session output when resumed, and user-provided focus.
- [ ] **CTX-02**: User-facing docs and prompts do not imply that Claude automatically receives the full Codex chat context.
- [ ] **CTX-03**: Review prompts instruct Claude to inspect untracked files from `git status` when relevant, not only tracked diffs.
- [ ] **CTX-04**: Planning and setup docs explain when to use design critique versus implementation-risk review.

### Jobs

- [ ] **JOB-01**: User can start long Claude reviews in the background and receive a task id immediately.
- [ ] **JOB-02**: User can list running and recent Claude jobs for the current repository.
- [ ] **JOB-03**: User can fetch the final output of a completed Claude job.
- [ ] **JOB-04**: User can cancel a running Claude job while the MCP server process still owns the child process.
- [ ] **JOB-05**: User-facing output states the process-lifetime limit of cancellation and avoids promising durable queue semantics.

### Safety

- [ ] **SAFE-01**: Claude review and adversarial review run read-only by default.
- [ ] **SAFE-02**: Default Claude tool restrictions allow file reads and read-style git commands while disallowing edit/write tools.
- [ ] **SAFE-03**: Write-capable rescue remains outside the standard v1 review path and is clearly warned when documented.
- [ ] **SAFE-04**: Codex hook review remains opt-in, reversible, and absent from the default team onboarding path.
- [ ] **SAFE-05**: Docs explain that automatic hook review can loop, block completion, and consume usage unexpectedly.

### Quality

- [ ] **QUAL-01**: Job-store behavior is covered by deterministic tests that do not require a live Claude account.
- [ ] **QUAL-02**: Claude runner behavior is testable with a fake Claude executable or equivalent fixture.
- [ ] **QUAL-03**: Tests cover JSON result parsing, text fallback, error status, timeout/launch failure handling, and session id persistence.
- [ ] **QUAL-04**: Tests or checks cover background status/result/cancel behavior.
- [ ] **QUAL-05**: CI runs lint, tests, syntax checks, and npm package dry-run checks.
- [ ] **QUAL-06**: Package dry-run output includes every runtime file required by the npm package.

### Docs

- [ ] **DOC-01**: README and setup docs present slash commands as the standard team rollout path.
- [ ] **DOC-02**: MCP tool names remain documented as the underlying capability and reference interface.
- [ ] **DOC-03**: Docs include examples for design review, adversarial review with focus, review against a base ref, background review, status, result, and cancel.
- [ ] **DOC-04**: Docs preserve unofficial/non-affiliation language for OpenAI and Anthropic.
- [ ] **DOC-05**: Docs identify time-sensitive claims, such as CLI flags, hook behavior, model aliases, billing, and package setup, for release-date revalidation.

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Follow-Up

- **FOL-01**: User can ask a follow-up question about a previous Claude result through an explicit follow-up tool or documented pattern.
- **FOL-02**: User can choose between continuing the latest Claude session, continuing a specific Claude session, and starting fresh.
- **FOL-03**: Follow-up docs distinguish Claude session continuity from Codex chat-context transfer.

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
| Automatic Claude review by default | Surprise latency, usage cost, and Codex/Claude loops would undermine team trust. |
| Hook-first onboarding | Hooks are advanced automation; manual slash commands are safer for the first rollout. |
| Full Codex chat-context transfer | Claude only receives explicit artifacts and repo access; implying hidden context transfer creates false confidence. |
| Hosted queue or cloud service | The v1 product is local-first and depends on local Claude Code authentication. |
| Write-enabled rescue as a normal workflow | It crosses the read-only safety boundary and can edit files with broad permissions. |
| Replacing Codex planning/review | Claude is a second-opinion reviewer, not the primary orchestrator. |
| Public marketplace polish before team validation | Internal reliability and docs come before broad distribution. |
| TypeScript migration in v1 | Current ESM/no-build packaging is simpler; TypeScript can follow after module boundaries and package strategy stabilize. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SETUP-01 | TBD | Pending |
| SETUP-02 | TBD | Pending |
| SETUP-03 | TBD | Pending |
| SETUP-04 | TBD | Pending |
| REV-01 | TBD | Pending |
| REV-02 | TBD | Pending |
| REV-03 | TBD | Pending |
| REV-04 | TBD | Pending |
| REV-05 | TBD | Pending |
| REV-06 | TBD | Pending |
| CTX-01 | TBD | Pending |
| CTX-02 | TBD | Pending |
| CTX-03 | TBD | Pending |
| CTX-04 | TBD | Pending |
| JOB-01 | TBD | Pending |
| JOB-02 | TBD | Pending |
| JOB-03 | TBD | Pending |
| JOB-04 | TBD | Pending |
| JOB-05 | TBD | Pending |
| SAFE-01 | TBD | Pending |
| SAFE-02 | TBD | Pending |
| SAFE-03 | TBD | Pending |
| SAFE-04 | TBD | Pending |
| SAFE-05 | TBD | Pending |
| QUAL-01 | TBD | Pending |
| QUAL-02 | TBD | Pending |
| QUAL-03 | TBD | Pending |
| QUAL-04 | TBD | Pending |
| QUAL-05 | TBD | Pending |
| QUAL-06 | TBD | Pending |
| DOC-01 | TBD | Pending |
| DOC-02 | TBD | Pending |
| DOC-03 | TBD | Pending |
| DOC-04 | TBD | Pending |
| DOC-05 | TBD | Pending |

**Coverage:**
- v1 requirements: 35 total
- Mapped to phases: 0
- Unmapped: 35

---
*Requirements defined: 2026-06-08*
*Last updated: 2026-06-08 after initial definition*
