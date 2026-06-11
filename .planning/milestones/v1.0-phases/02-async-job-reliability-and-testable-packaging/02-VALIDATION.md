---
phase: 02
slug: async-job-reliability-and-testable-packaging
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-06-09
updated: 2026-06-09
---

# Phase 02 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

Phase 2 is Nyquist-compliant: every Phase 2 requirement has automated
verification through Node's built-in test runner, source contract assertions,
and the package dry-run gate in `npm run ci`.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in test runner (`node:test`) |
| **Config file** | none |
| **Quick run command** | `node --test test/job-lifecycle.test.mjs test/docs-rollout-contract.test.mjs` |
| **Full suite command** | `npm run ci` |
| **Estimated runtime** | ~4 seconds locally |

---

## Sampling Rate

- **After every task commit:** Run `node --test test/job-lifecycle.test.mjs test/docs-rollout-contract.test.mjs`
- **After every plan wave:** Run `npm run ci`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~4 seconds locally

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | QUAL-01, QUAL-02 | TM-13, TM-14 | Runner accepts fake Claude binary and temp state root without touching user state. | integration | `node --test test/job-lifecycle.test.mjs test/state-store.test.mjs` | yes | green |
| 02-01-02 | 01 | 1 | QUAL-03, JOB-03 | TM-11, TM-12 | JSON, text fallback, non-zero exit, missing binary, timeout, session id, and final result paths are deterministic. | integration | `node --test test/job-lifecycle.test.mjs` | yes | green |
| 02-01-03 | 01 | 1 | JOB-01, JOB-02, JOB-03, JOB-04, JOB-05, QUAL-04 | TM-11, TM-15 | Background start returns a task id; status/result/cancel expose process-lifetime semantics without durable queue promises. | integration | `node --test test/job-lifecycle.test.mjs` | yes | green |
| 02-01-04 | 01 | 1 | QUAL-05, QUAL-06 | TM-13, TM-18 | CI and package dry-run prove runtime helper files remain in the npm artifact. | ci/package | `npm run ci` | yes | green |
| 02-02-01 | 02 | 2 | JOB-01, JOB-02, JOB-03, JOB-04, JOB-05, DOC-03 | TM-16, TM-17 | Docs teach base/focus/background/status/result/cancel and cancellation boundaries. | docs contract | `node --test test/docs-rollout-contract.test.mjs` | yes | green |
| 02-02-02 | 02 | 2 | QUAL-05, QUAL-06 | TM-18 | Package contract tests fail if runtime imports or README-linked docs are omitted from `package.json.files`. | package contract | `node --test test/docs-rollout-contract.test.mjs && npm run pack:check` | yes | green |
| 02-02-03 | 02 | 2 | DOC-03, QUAL-05, QUAL-06 | TM-16, TM-18 | Full CI keeps docs examples, syntax checks, tests, and npm pack dry-run aligned. | ci/package | `npm run ci` | yes | green |

*Status: green = automated check passed on 2026-06-09.*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

---

## Manual-Only Verifications

All Phase 2 behaviors have automated verification.

Live authenticated Claude usage remains intentionally outside this phase's
automated gates. Phase 2 validates the local lifecycle, runner, state-store, and
package contract with fake-Claude tests so CI does not depend on a teammate's
Claude account, network state, or usage credits.

---

## Validation Audit 2026-06-09

| Metric | Count |
|--------|-------|
| Requirements audited | 12 |
| Automated coverage | 12 |
| Gaps found | 1 |
| Resolved | 1 |
| Escalated | 0 |

Resolved gap:

- `JOB-02` now has explicit coverage that a completed background job still
  appears in `claude_status` recent-job output.

---

## Validation Sign-Off

- [x] All tasks have automated verification
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all missing references
- [x] No watch-mode flags
- [x] Feedback latency < 10 seconds locally
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-06-09
