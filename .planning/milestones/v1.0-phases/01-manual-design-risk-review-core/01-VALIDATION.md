---
phase: "01"
slug: manual-design-risk-review-core
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-06-08
---

# Phase 1 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

Phase 1 is validated by source-level runtime contract tests, docs/prompt
contract tests, lint, syntax checks, and npm package dry-run checks. The
external Claude Code account/auth state remains a manual smoke concern because
it depends on the developer's local machine and Claude CLI session.

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in `node:test`, ESLint, npm pack dry-run |
| **Config file** | `package.json` scripts |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm run ci` |
| **Estimated runtime** | ~3 seconds |

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm run ci`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | REV-01, REV-02, REV-03, REV-04, REV-05, CTX-01, CTX-02, CTX-03, SAFE-01, SAFE-02 | TM-02, TM-03 | Review tools stay read-only, accept optional focus/base, and state explicit Codex-to-Claude context. | contract | `npm test` | yes | green |
| 01-01-02 | 01 | 1 | REV-06, SETUP-04, CTX-01, CTX-02 | TM-04, TM-05 | Results say read-only/no edits; failures classify missing binary, auth/reachability, timeout, malformed JSON/text fallback, and context size. | contract | `npm test` | yes | green |
| 01-01-03 | 01 | 1 | SETUP-03, SETUP-04 | TM-01, TM-04 | Setup diagnostics expose effective Claude binary/model/timeout, MCP timeout alignment, and live-review caveats. | contract | `npm test` | yes | green |
| 01-01-04 | 01 | 1 | SETUP-03, SETUP-04, REV-01..REV-06, CTX-01..CTX-04, SAFE-01, SAFE-02 | TM-01..TM-05 | Runtime contract checks, lint, package contents, and source assertions all pass. | full suite | `npm run ci` | yes | green |
| 01-02-01 | 02 | 2 | REV-01, REV-02, REV-03, REV-04, REV-05, REV-06, SAFE-01, SAFE-02 | TM-06, TM-07, TM-10 | Slash prompts teach read-only implementation-risk and adversarial review modes with priority severities and no edit claim. | docs contract | `npm test` | yes | green |
| 01-02-02 | 02 | 2 | SETUP-01, SETUP-02, DOC-01, DOC-02, DOC-04, SAFE-04, SAFE-05 | TM-07, TM-08 | README teaches slash commands first, keeps MCP tool names as reference, and labels hooks as advanced opt-in. | docs contract | `npm test` | yes | green |
| 01-02-03 | 02 | 2 | CTX-01, CTX-02, CTX-03, CTX-04, SETUP-04, DOC-01, DOC-02 | TM-06, TM-09 | Setup/design docs define explicit context, selected planning docs, resume semantics, and failure categories. | docs contract | `npm test` | yes | green |
| 01-02-04 | 02 | 2 | SETUP-01, SETUP-02, REV-01..REV-06, CTX-01..CTX-04, DOC-01, DOC-02, DOC-04 | TM-06..TM-10 | Docs, prompts, non-affiliation wording, package contents, lint, syntax, and tests all pass. | full suite | `npm run ci` | yes | green |

## Source Assertions

These targeted checks are part of the Phase 1 validation sample:

```sh
rg "High|Medium|Low|No high-confidence findings" server.mjs README.md docs prompts test
rg "no files were edited|full Codex chat|tool_timeout_sec|git status --short --branch" server.mjs README.md docs prompts test
rg "/claude-review|/claude-adversarial|claude_review|claude_adversarial_review" README.md docs prompts test server.mjs
rg "not affiliated with, endorsed by, or sponsored by|OpenAI|Anthropic" README.md docs NOTICE LICENSE
```

## Wave 0 Requirements

Existing infrastructure covers all Phase 1 requirements.

- [x] `test/runtime-contract.test.mjs` - runtime review, context, setup, read-only, and failure-shape contract
- [x] `test/docs-rollout-contract.test.mjs` - slash prompt, README, setup, design, context, and safety documentation contract
- [x] `package.json` - `lint`, `test`, `pack:check`, and `ci` scripts

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Live authenticated Claude Code setup smoke | SETUP-03, SETUP-04 | Depends on the developer's installed `claude` binary, local auth state, network, and MCP client timeout settings. | Run `claude auth status`, restart Codex with this MCP server registered by absolute path, then invoke `claude_setup`. |

## Latest Evidence

- `npm run ci` passed on 2026-06-08.
- `node --check server.mjs` and `node --check hooks/review-gate.mjs` passed through `npm test`.
- Node test runner passed 7 tests across runtime and docs rollout contracts.
- `npm pack --dry-run --cache ./.npm-cache` included runtime files, prompts, docs, `LICENSE`, and `NOTICE`.
- Source assertion `rg` commands found the expected review, context, setup, and non-affiliation contract strings.

## Validation Sign-Off

- [x] All tasks have automated verification or a documented manual-only smoke check
- [x] Sampling continuity: no 3 consecutive tasks without automated verification
- [x] Wave 0 covers all Phase 1 requirements
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-06-08
