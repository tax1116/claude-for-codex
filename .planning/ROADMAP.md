# Roadmap: claude-for-codex

## Overview

v1.0 is already a usable manual Claude review MVP for Codex-first teams. v2.0
adds an explicit follow-up workflow to make the next question after a Claude
result clearer and safer. The goal is to let Codex users ask Claude a second
question about a prior Claude result without implying that Claude can see the
full Codex chat. The operator chooses the session mode every time: continue
latest, continue a specific session, or start fresh.

## Milestone v2.0: Explicit Claude Follow-Up

### Phases

**Phase Numbering:**
- This milestone resets visible phase numbering to Phase 1.
- v1.0 phase artifacts are archived under `.planning/milestones/v1.0-phases/`.
- Decimal phases (1.1, 1.2) may be inserted only for urgent follow-up scope
  corrections after planning.

- [ ] **Phase 1: Explicit Claude Follow-Up Workflow** - Users can ask Claude follow-up questions about prior Claude review results with visible session-mode control and read-only safety.

### Phase Details

#### Phase 1: Explicit Claude Follow-Up Workflow

**Goal:** Users can explicitly ask Claude a follow-up question about a previous
Claude review result while choosing whether to continue the latest session,
continue a specific session, or start fresh.

**Mode:** mvp
**Depends on:** v1.0 review, job, session, and result foundations
**Requirements:** FOL-01, FOL-02, FOL-03, FOL-04, FOL-05, CTX-05, CTX-06, CTX-07, SAFE-06, SAFE-07, QUAL-07, QUAL-08, QUAL-09, DOC-06, DOC-07, DOC-08

**Success Criteria** (what must be TRUE):
  1. User can trigger a follow-up manually from Codex using an explicit MCP tool or documented slash-command pattern.
  2. User can choose latest-session, specific-session, or fresh-session behavior, and the output states which mode was used.
  3. Follow-up prompts pass prior Claude output, job/result context, or user-provided context explicitly and do not claim hidden Codex chat transfer.
  4. Follow-up review remains read-only by default and does not silently enter write-capable rescue behavior.
  5. Deterministic tests cover prompt construction, session selection, missing-session diagnostics, and job/result compatibility.
  6. README/setup docs include foreground and background follow-up examples plus operator guidance for choosing a session mode.

**Plans:** Not planned yet

## Progress

**Execution Order:**
Phases execute in numeric order: 1

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Explicit Claude Follow-Up Workflow | 0/0 | Planned | - |

## Archive

- v1.0 MVP roadmap: `.planning/milestones/v1.0-ROADMAP.md`
- v1.0 MVP requirements: `.planning/milestones/v1.0-REQUIREMENTS.md`
- v1.0 MVP phase artifacts: `.planning/milestones/v1.0-phases/`
