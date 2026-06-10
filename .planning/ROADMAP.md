# Roadmap: claude-for-codex

## Overview

The MVP turns the existing local MCP bridge into a reliable Codex-first
replacement workflow for the `codex-plugin-cc` idea: Codex users keep Codex as
the main working surface and invoke Claude Code deliberately for read-only design
critique, implementation-risk review, rescue, async job controls, and documented
safety limits. Hooks and write-capable rescue remain outside the default launch
path.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work.
- Decimal phases (2.1, 2.2): Urgent insertions after planning.

- [x] **Phase 1: Manual Design/Risk Review Core** - Users can install, configure, and manually invoke slash-command-first read-only Claude reviews grounded in explicit repo context.
- [x] **Phase 2: Async Job Reliability And Testable Packaging** - Users can run long reviews predictably while maintainers can verify runner, job-store, and package behavior without live Claude.
- [ ] **Phase 3: Opt-In Automation Boundaries And Release Revalidation** - Advanced hooks, write-capable rescue, and time-sensitive release claims stay explicitly guarded and outside default onboarding.

## Phase Details

### Phase 1: Manual Design/Risk Review Core
**Goal:** Users can deliberately ask Claude Code for read-only design critique and implementation-risk review through the standard manual slash-command path.
**Mode:** mvp
**Depends on:** Nothing (first phase)
**Requirements:** SETUP-01, SETUP-02, SETUP-03, SETUP-04, REV-01, REV-02, REV-03, REV-04, REV-05, REV-06, CTX-01, CTX-02, CTX-03, CTX-04, SAFE-01, SAFE-02, DOC-01, DOC-02, DOC-04
**Success Criteria** (what must be TRUE):
  1. User can install dependencies on Node.js 18.18 or later, register the MCP server with an absolute path, and run setup checks that identify Claude CLI availability, auth, binary, and timeout-prone configuration issues.
  2. User can invoke Claude review from Codex via slash commands or MCP tools, including adversarial design critique and implementation-risk review modes.
  3. User can narrow a review with a base ref and focus area, and receives prioritized concrete findings that do not claim Claude edited files.
  4. User can see from prompts and docs that Claude receives only explicit prompts, allowed repo reads, read-style git state, selected planning artifacts, resumed Claude output when provided, and user focus.
  5. User-facing docs present slash commands as the standard team rollout path, MCP tool names as the reference interface, and preserve unofficial/non-affiliation language for OpenAI and Anthropic.
**Plans:** `01-01-PLAN.md` complete, `01-02-PLAN.md` complete

### Phase 2: Async Job Reliability And Testable Packaging
**Goal:** Users can run long Claude reviews through predictable background jobs, and maintainers can verify the job, runner, and package contract without a live Claude account.
**Mode:** mvp
**Depends on:** Phase 1
**Requirements:** JOB-01, JOB-02, JOB-03, JOB-04, JOB-05, QUAL-01, QUAL-02, QUAL-03, QUAL-04, QUAL-05, QUAL-06, DOC-03
**Success Criteria** (what must be TRUE):
  1. User can start a long Claude review in the background, receive a task id immediately, list running and recent jobs for the current repository, and fetch final output after completion.
  2. User can cancel a running Claude job while the MCP server still owns the child process, and output clearly states cancellation's process-lifetime limit without promising durable queue semantics.
  3. Maintainer can run deterministic fake-Claude tests for job-store behavior, runner JSON parsing, text fallback, error status, timeout or launch failures, session id persistence, and status/result/cancel flows.
  4. CI runs lint, tests, syntax checks, and npm package dry-run checks across the supported package contract.
  5. Maintainer can confirm npm package dry-run output includes every runtime file required by the package, and docs include examples for design review, adversarial review with focus, base-ref review, background review, status, result, and cancel.
**Plans:** `02-01-PLAN.md` complete, `02-02-PLAN.md` complete

### Phase 3: Opt-In Automation Boundaries And Release Revalidation
**Goal:** Users can trust that advanced automation and write-capable rescue stay explicit, reversible, and outside the default v1 review path.
**Mode:** mvp
**Depends on:** Phase 2
**Requirements:** SAFE-03, SAFE-04, SAFE-05, DOC-05
**Success Criteria** (what must be TRUE):
  1. User can complete default team onboarding without enabling Codex hook review, and hook documentation clearly explains opt-in setup, reversibility, loop risk, blocking risk, and usage-cost risk.
  2. User can identify write-capable rescue as outside the standard v1 review path, with clear warnings before any documentation or workflow crosses the read-only boundary.
  3. Release reviewer can find time-sensitive claims marked for release-date revalidation, including CLI flags, hook behavior, model aliases, billing, and package setup.
**Plans:** `03-01-PLAN.md` planned, `03-02-PLAN.md` planned

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Manual Design/Risk Review Core | 2/2 | Complete | 2026-06-08 |
| 2. Async Job Reliability And Testable Packaging | 2/2 | Complete | 2026-06-09 |
| 3. Opt-In Automation Boundaries And Release Revalidation | 0/2 | Planned | - |
