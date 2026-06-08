# Project Research Summary

**Project:** claude-for-codex
**Domain:** Brownfield local Node.js MCP plugin for Codex-to-Claude Code review workflows
**Researched:** 2026-06-08
**Confidence:** HIGH

## Executive Summary

`claude-for-codex` is a local-first MCP plugin that lets Codex deliberately ask Claude Code for an independent second opinion. The v1 product should not be positioned as automatic review or autonomous multi-agent orchestration. It should be a manual, slash-command-first team workflow for two high-value moments: design critique before committing to an approach, and implementation-risk review before merge.

The recommended approach is to keep the current Node.js ESM MCP package, preserve npm-based installation, keep Claude Code as a local CLI dependency, and harden the existing behavior rather than adding a new stack. The first milestone should make `/claude-review` and `/claude-adversarial` the obvious team path while MCP tools remain the underlying capability surface. Reviews must be read-only by default, grounded in explicit artifacts such as repo state, diffs, planning docs, base refs, and user focus.

The main risks are unsafe automation, false context assumptions, and brittle local process state. Hooks must remain opt-in and reversible because stop-time review can loop, block completion, and consume usage unexpectedly. Claude does not receive full Codex chat context unless explicit artifacts are passed, so docs and prompts must state that contract plainly. Background jobs, cancellation, stale running records, launch/auth failures, and context exhaustion need deterministic fake-Claude tests before the workflow is trusted by the team.

## Key Findings

### Recommended Stack

Use the current small Node.js ESM stack for v1. The research strongly recommends improving module boundaries and tests before any TypeScript migration, bundler, daemon, database, hosted queue, or hook-first automation. The package is already shaped correctly for a local MCP bridge: Codex launches a Node MCP server over stdio, the server invokes `claude -p --output-format json`, and npm packaging plus `npm pack --dry-run` protect distribution.

**Core technologies:**
- Node.js `>=18.18` — runtime for the MCP server, hook script, and npm binary; keep CI on Node 18, 20, and 22.
- ESM JavaScript `.mjs` — current source format with no build step; safest for v1 package reliability.
- `@modelcontextprotocol/sdk` — official MCP capability surface for local stdio integration; avoid hand-rolled protocol handling.
- `zod` — runtime schema validation for MCP tool inputs; keep tool contracts explicit.
- Claude Code CLI — local authenticated `claude` binary invoked with print-mode JSON output; centralize flags and permission policy in the runner.
- `node:test` plus fake Claude fixtures — preferred test expansion path; CI must not require a live Claude account, Codex runtime, or network.

### Expected Features

The initial product should lead with manual review commands, not a tool catalog. Setup/status/result/cancel/rescue matter, but they support the primary workflow rather than defining it.

**Must have (table stakes):**
- Slash-command-first onboarding for `/claude-review` and `/claude-adversarial` — team members need a memorable manual entry point.
- Read-only design critique — Claude challenges architecture boundaries, complexity, assumptions, and simpler alternatives.
- Implementation-risk detection — Claude surfaces missing tests, state edge cases, cancellation/resume gaps, context-limit risks, and failure modes.
- Base-ref and focus controls — review quality depends on narrowing the comparison and question.
- Background review with status/result retrieval — large reviews need async execution and predictable output retrieval.
- Cancel running review — long or mistaken jobs need a local escape hatch, with honest process-lifetime limits.
- Setup verification — users need fast feedback that Claude Code is installed, authenticated, and reachable from Codex.
- Explicit context contract — Claude sees only the prompt, allowed repo reads, git state, selected artifacts, prior Claude output when provided, and user focus; it does not automatically see the full Codex chat.

**Should have (competitive):**
- Independent model-perspective review inside Codex — the core differentiator over copying diffs into another chat.
- Adversarial review mode with user-supplied focus — useful for risky architecture, migrations, auth, race conditions, state, and test adequacy.
- Repo-grounded review — Claude can inspect local files and read-style git state through allowed tools.
- Session-aware continuation — useful after validation, but must be explicit about Claude-session continuity versus Codex-chat context.
- Rescue as escalation — keep read-only by default and secondary to review.

**Defer (v2+):**
- Hook-based review gates as a documented advanced mode — powerful but risky; hooks stay opt-in.
- Durable queue/database/process manager — only if local background jobs become central and JSON job files are insufficient.
- Write-capable rescue — exceptional, guarded, and warned; never the standard review path.
- Public marketplace polish and broad autonomous orchestration — defer until internal manual review is reliable.
- TypeScript or bundled `dist/` package — defer until behavior boundaries and package strategy are stable.

### Architecture Approach

Keep v1 as a local single-process MCP plugin, but stop growing the current monolithic `server.mjs`. Extract a testable core around job state, Claude invocation, prompts, and session resolution while preserving the current package binary path. Hooks should remain a separate opt-in script and should not depend on the MCP server lifecycle.

**Major components:**
1. MCP adapter — owns server construction, tool names, `zod` schemas, and MCP response shaping.
2. Prompt builder — pure functions for review, adversarial review, rescue, and follow-up prompts from explicit inputs.
3. Claude runner — centralizes CLI args, read-only/write permission flags, spawning, timeouts, stdout/stderr capture, and JSON/text parsing.
4. Job store — repo-scoped file-backed JSON store for jobs, status transitions, latest session id, and stale-running detection.
5. Job orchestrator — coordinates foreground/background lifecycle, formatting, cancellation, and runner/store interaction.
6. Session/follow-up service — makes latest-session, exact-session, fresh-start, and future follow-up semantics explicit.
7. Optional hook — standalone Codex `Stop` integration that remains disabled by default and reversible.

### Critical Pitfalls

1. **Hook review loops burn usage and block completion** — keep hooks out of default onboarding, cap hook work, test `OK`/`BLOCK:`/failure paths, and document disable next to enable.
2. **Write permission bypass becomes casual rescue** — keep review and follow-up read-only, exclude `allow_write` from standard prompts, and require explicit guardrails before passing dangerous permission flags.
3. **Token/context exhaustion is treated as a Claude problem** — preflight large diffs where practical, make `base`, `focus`, and `background:true` prominent, and return narrowing guidance on broad/failed reviews.
4. **Stale background jobs look running forever** — extract job store, mark abandoned/stale jobs after restart or missing process handles, and avoid promising durable queue semantics.
5. **Fake context sharing overpromises what Claude sees** — document and test the explicit artifact boundary; session resume is Claude-session continuity, not Codex conversation transfer.
6. **Live Claude dependency is hidden until runtime** — make setup/status diagnostics first-class and use fake-Claude tests for CI.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Manual Review Core

**Rationale:** The first milestone should deliver the product promise with the safest workflow: manual slash-command design critique and implementation-risk review. This phase must establish the read-only permission boundary, context contract, and testable runner/job foundations before adding automation or broader rescue behavior.

**Delivers:** Slash-command-first docs and prompts for `/claude-review` and `/claude-adversarial`; read-only `claude_review` and `claude_adversarial_review` behavior; explicit `base`/`focus` examples; setup verification path; background status/result/cancel contract; fake-Claude tests for prompt basics, runner parsing, permission flags, job JSON, status/result formatting, cancellation, and stale-running records.

**Addresses:** Slash-command onboarding, design critique, implementation-risk detection, base/focus controls, read-only safety, setup verification, background jobs, status/result, cancel, and honest context contract.

**Avoids:** Hook loops, write permission bypass, fake context sharing, real-Claude CI dependency, stale background jobs, and package `files` omissions.

### Phase 2: Follow-Up, Diagnostics, And Scope UX

**Rationale:** Once manual review works, the next source of user friction will be "what now?" after a result or failure. Follow-up and diagnostics should be added only after the core runner/store/prompt boundaries are testable.

**Delivers:** Explicit follow-up/session resolver; optional `claude_followup` or documented follow-up pattern; better Claude launch/auth/model/timeout/JSON-parse error classification; large-diff and context-limit guidance; clearer result summaries; setup/status improvements; cleanup/retention guidance for local job output.

**Uses:** Existing Node ESM modules, file-backed job store, injectable Claude runner, prompt builder, session service, and fake Claude fixtures.

**Implements:** Session/follow-up service, structured error formatting, stale/abandoned job UX, and review narrowing guidance.

**Avoids:** Treating `claude_rescue resume:true` as generic follow-up, treating context exhaustion as opaque Claude failure, surprising latest-result selection, and overclaiming durable queue control.

### Phase 3: Guarded Rescue And Optional Hook Automation

**Rationale:** Rescue and hooks are useful power-user workflows, but they carry the highest trust and cost risks. They should follow a proven manual review path, not lead the rollout.

**Delivers:** Read-only rescue documentation as a secondary escalation path; explicit guard for any write-enabled rescue; hook enable/disable/status documentation or tooling; hook-specific tests for allow/block/malformed/timeout/launch failure; shared or intentionally duplicated prompt/permission policy; release checklist for external CLI/MCP/hook docs.

**Uses:** Centralized runner permission policy, tested prompt snippets, setup diagnostics, and package verification.

**Implements:** Guarded rescue semantics and optional Codex `Stop` hook polish without making hooks default.

**Avoids:** Surprise usage loops, config drift between MCP and hook behavior, casual `--dangerously-skip-permissions`, and stale billing/setup claims.

### Phase 4: Release Readiness And Broader Distribution

**Rationale:** Public distribution should wait until the team validates manual review reliability and the support contract is clear.

**Delivers:** npm package content assertions, install-from-packed-tarball smoke check, dated official-doc recheck, legal/unofficial language review, README simplification around slash-command-first use, manual real-Claude smoke checklist, and compatibility notes.

**Uses:** `npm run ci`, `npm run pack:check`, Node 18/20/22 CI, official OpenAI/Anthropic/MCP docs, and local fake-Claude coverage.

**Avoids:** Missing runtime files from the `files` allowlist, stale CLI flag/billing claims, accidental official-affiliation language, and release confidence based only on local source-tree tests.

### Phase Ordering Rationale

- Manual review comes first because it is the core value and the safest path for team adoption.
- Job store and runner extraction must precede follow-up, diagnostics, cancellation improvements, and rescue changes because those behaviors depend on process and state correctness.
- Context and prompt contracts belong in Phase 1 because misleading users about Codex-chat transfer creates false confidence in every later feature.
- Hooks come after manual review because hook automation has known loop, cost, and interruption risks.
- Release polish comes last because packaging and public docs should describe validated behavior, not aspirational automation.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2:** Claude CLI error surfaces, auth diagnostics, context/turn/budget behavior, and follow-up session semantics should be checked against current Anthropic docs before implementation.
- **Phase 3:** Codex hook behavior and config editing/status conventions should be rechecked against current Codex docs before automating setup or documenting advanced gates.
- **Phase 4:** npm publish contents, legal/unofficial language, billing notes, model aliases, and CLI flags need release-date validation.

Phases with standard patterns (skip research-phase):
- **Phase 1:** Node ESM module extraction, `node:test`, fake process runners, file-backed tempdir tests, `zod` schemas, and npm pack checks are well-documented patterns.
- **Phase 2:** Basic result formatting, stale JSON-job detection, and setup/status command shaping can proceed from local codebase evidence once external CLI behavior is checked.

## Decision Recommendations

- Make the first milestone "manual slash-command design/risk review," not "Claude automation."
- Keep both MCP tools and slash commands, but document slash commands as the standard team path.
- Keep hooks opt-in, advanced, and reversible; do not install or enable them by default.
- Keep all review and follow-up paths read-only; treat write rescue as exceptional and guarded.
- State plainly that Claude receives explicit artifacts, repo reads, git state, and focus text, not hidden Codex chat context.
- Extract job store and Claude runner before expanding feature surface.
- Use `node:test` and fake Claude fixtures before adding dependencies or calling live Claude in CI.
- Preserve Node ESM/no-build packaging for v1; defer TypeScript until package and module boundaries stabilize.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Verified from project planning, current repo shape, package metadata, MCP SDK direction, Claude CLI docs, and reverse plugin reference. |
| Features | HIGH | Strong agreement across project goals and feature research: slash-command-first manual review, read-only safety, background support, and explicit context contract are v1 table stakes. |
| Architecture | MEDIUM-HIGH | Current monolith and target boundaries are clear; exact filenames can shift during extraction, but component responsibilities are stable. |
| Pitfalls | HIGH | Risks are repo-specific and repeated across project docs: hook loops, write bypass, stale jobs, context exhaustion, fake context sharing, and live Claude dependency. |

**Overall confidence:** HIGH

### Gaps to Address

- Claude setup/auth diagnostics: verify current non-interactive `claude -p` failure modes during Phase 2 planning and keep CI fake-based.
- Follow-up semantics: decide whether v1.x adds a `claude_followup` tool or only a documented pattern; either way, require explicit context source.
- Stale job behavior: choose exact status labels such as `stale` or `abandoned` before docs and tests freeze the contract.
- Hook automation: recheck Codex hook config behavior before any setup/status tooling; keep manual disable instructions mandatory.
- Package layout: if `src/` is added, update `package.json` `files` and inspect `npm pack --dry-run` output in the same phase.
- External docs staleness: revalidate Claude CLI flags, model/billing language, MCP config, and hook behavior before release.

## Sources

### Primary (HIGH confidence)

- `.planning/PROJECT.md` — project scope, active requirements, out-of-scope boundaries, constraints, and decisions.
- `.planning/research/STACK.md` — v1 stack recommendation, deferred technology choices, package/release concerns, and source-backed compatibility notes.
- `.planning/research/FEATURES.md` — table stakes, differentiators, anti-features, MVP definition, and v1/v2 recommendations.
- `.planning/research/ARCHITECTURE.md` — current architecture, target module boundaries, data flows, build order, and anti-patterns.
- `.planning/research/PITFALLS.md` — critical/moderate pitfalls, prevention strategies, phase mapping, and completion checklist.
- Local source references cited by research docs: `server.mjs`, `hooks/review-gate.mjs`, `README.md`, `docs/DESIGN.md`, `docs/SETUP.md`, `package.json`, `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/CONCERNS.md`, `.planning/codebase/INTEGRATIONS.md`, `.planning/codebase/TESTING.md`.

### External (MEDIUM-HIGH confidence)

- OpenAI Docs MCP page: https://developers.openai.com/learn/docs-mcp — Codex MCP configuration direction.
- Anthropic Claude Code CLI reference: https://code.claude.com/docs/en/cli-usage — `claude -p`, JSON output, max turns, resume, model, MCP config, and tool restriction flags.
- Model Context Protocol SDK page: https://modelcontextprotocol.io/docs/sdk — SDK support for MCP servers, clients, and transports.
- OpenAI `codex-plugin-cc` README: https://github.com/openai/codex-plugin-cc/blob/main/README.md — reverse-direction workflow reference for slash commands, background review, and review gate warnings.

---
*Research completed: 2026-06-08*
*Ready for roadmap: yes*
