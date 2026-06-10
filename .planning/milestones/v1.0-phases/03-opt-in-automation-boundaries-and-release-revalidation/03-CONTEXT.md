---
phase: "03"
slug: opt-in-automation-boundaries-and-release-revalidation
status: ready-for-planning
created: 2026-06-09
---

# Phase 3 - Context

## Phase Boundary

Phase 3 closes the v1 safety and release-readiness boundaries.

This phase covers advanced automation documentation, write-capable rescue
warnings, and release-date revalidation markers for time-sensitive claims.

This phase does not make hook review the default path, add hook setup tooling,
make write-capable rescue normal, add hosted services, or perform a public npm
release.

## Locked Decisions

- Manual slash-command review remains the standard team rollout path.
- Codex Stop hook review remains advanced, optional, and reversible.
- Hook documentation must state loop risk, blocking risk, and usage-cost risk.
- Write-capable `claude_rescue` remains outside the standard v1 review path.
- Any path that uses `allow_write: true` or `--dangerously-skip-permissions`
  must be visibly warned.
- Release-facing claims that can drift must be marked for release-date
  revalidation instead of being treated as timeless truth.
- Time-sensitive claims include Codex CLI/MCP config and hook behavior, Claude
  Code CLI behavior, model aliases, billing/Agent SDK credit language, and npm
  package setup commands.

## Current Baseline

Phase 1 and Phase 2 provide:

- Slash-command-first manual review docs and prompt wrappers.
- Read-only review and adversarial review as the default path.
- `claude_rescue` with `allow_write` as an explicit MCP tool argument.
- Optional `hooks/review-gate.mjs` and docs that already say hooks are advanced
  opt-in.
- Runtime and fake-Claude tests for background job lifecycle.
- Package dry-run checks and docs contract tests.

Gaps that remain for Phase 3:

- Hook setup is documented, but reversibility and "not default onboarding" need
  stronger source-level contract coverage.
- Hook risk language exists, but tests should lock loop, blocking, and usage-cost
  warnings across README/setup/design docs and hook source comments.
- `claude_rescue` is documented, but write-capable rescue needs a stronger
  warning boundary in docs and tests.
- Release-facing docs contain current claims about Codex hooks, model aliases,
  billing, npm install/setup, and CLI config that can drift over time.
- Publishing docs still contain older initial-repo commands and should be
  aligned with the current `master`/`dev` promotion policy before release.

## Canonical References

- `.planning/ROADMAP.md` - Phase 3 goal and success criteria.
- `.planning/REQUIREMENTS.md` - SAFE-03, SAFE-04, SAFE-05, DOC-05.
- `README.md` - primary user-facing setup and safety docs.
- `docs/SETUP.md` - detailed setup, hooks, tools, env, and safety docs.
- `docs/DESIGN.md` - design boundary docs.
- `docs/PUBLISHING.md` - release/publishing guidance.
- `docs/BRANCHING.md` - current branch and promotion policy.
- `hooks/review-gate.mjs` - optional Stop hook implementation and warning.
- `server.mjs` - `claude_rescue` tool schema and write flag.
- `src/claude-runner.mjs` - `allowWrite` argument construction.
- `test/docs-rollout-contract.test.mjs` - docs/package contract tests.
- `test/runtime-contract.test.mjs` - runtime source contract tests.

## Specific Ideas

- Add docs contract tests for the hook boundary before changing docs.
- Add runtime/source contract tests that write-capable rescue remains explicit
  and read-only review tools do not enable writes.
- Add a release revalidation table or callout in docs with columns for claim,
  source to check, and when to revalidate.
- Keep any release revalidation task as a documented checklist, not an automated
  internet lookup in CI.
- Update publishing docs to refer to the current protected `master` promotion
  flow rather than fresh-repo `main` examples where appropriate.

## Deferred Ideas

- Hook behavior tests for allow/block/malformed/timeout/launch failure remain v2
  unless Phase 3 scope is explicitly expanded.
- Hook setup tooling remains v2.
- Public npm publication remains outside this phase.
- Structured release automation remains outside this phase.
