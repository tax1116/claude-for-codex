---
phase: "04"
slug: skill-based-review-ux-and-claude-repo-read-consent
status: ready-for-planning
created: 2026-06-11
---

# Phase 4 - Context

## Phase Boundary

Phase 4 turns the v1 slash-prompt-first Claude review bridge into a
skill-first Codex workflow with an explicit repo-read permission gate.

This phase covers Codex skill files, compatibility treatment for existing slash
prompts, setup diagnostics for skill installation, package inclusion, and a
shared repo-read consent policy before live Claude runs.

This phase does not make automatic review the default, add hosted/GitHub PR bot
behavior, build a native Codex App permission UI, rename adversarial review to
design review, or normalize write-capable rescue.

## Locked Decisions

- D-26: Codex skills become the standard team-facing workflow surface for
  Claude review.
- D-27: `$claude-review`, `$claude-adversarial`, `$claude-rescue`, and
  `$claude-setup` are the initial skill entry points.
- D-28: Skill files are thin workflow launchers. MCP tool handlers remain the
  source of truth for review policy, output format, read-only boundaries,
  consent gating, and failure guidance.
- D-29: Slash prompt wrappers may remain only as optional compatibility aliases.
  They should not be the standard path and should not expose long internal
  operating instructions in chat.
- D-30: Keep the current `claude_adversarial_review` naming. Do not add a new
  `$claude-design-review` surface in this phase.
- D-31: Before a live Claude review or rescue run, the user must be told in
  plain language that Claude Code may read this repo's diff, related files, and
  selected planning docs.
- D-32: The permission choices are allow once, always allow for this repository,
  and cancel.
- D-33: Repo-level consent must be inspectable and revocable through tools or
  documented commands, without hand-editing state files.
- D-34: The consent policy applies to every current Claude-launching path:
  review, adversarial review, and rescue. Any future follow-up tool must use the
  same shared gate.
- D-35: Write-capable rescue remains separately guarded by `allow_write`; repo
  read consent does not imply permission to edit files.
- D-36: v1/v2 are product milestone labels. npm package releases stay in
  `0.x.y` until team usage proves the workflow stable enough for `1.0.0`.

## Current Baseline

Existing runtime and docs provide:

- MCP tools: `claude_setup`, `claude_review`,
  `claude_adversarial_review`, `claude_rescue`, `claude_status`,
  `claude_result`, and `claude_cancel`.
- Slash prompt wrappers under `prompts/claude-*.md`.
- Read-only Claude runner defaults in `src/claude-runner.mjs`.
- Repo-scoped file state in `src/state-store.mjs`.
- Docs contract tests in `test/docs-rollout-contract.test.mjs`.
- Runtime/source contract tests in `test/runtime-contract.test.mjs`.
- Fake-Claude lifecycle tests in `test/job-lifecycle.test.mjs`.
- State-store tests in `test/state-store.test.mjs`.
- Package dry-run coverage through `npm run pack:check`.

Gaps that remain for Phase 4:

- There is no packaged Codex skill source tree.
- `claude_setup` cannot report whether skill files are installed or missing.
- README/setup/design docs still describe slash prompts as the standard team UX.
- Existing slash prompt bodies are visible when invoked in Codex chat.
- Live Claude review can start without a product-level repo-read consent gate.
- Repo-level consent cannot be inspected or revoked through plugin tools.
- There is no source contract that prevents the runner from spawning Claude
  before repo-read consent is granted.

## Canonical References

- `.planning/ROADMAP.md` - Phase 4 goal and success criteria.
- `.planning/REQUIREMENTS.md` - SKILL-01 through SKILL-04 and CONSENT-01
  through CONSENT-04.
- `.planning/PROJECT.md` - product promise, constraints, and decisions.
- `README.md` - primary user-facing setup and workflow docs.
- `docs/SETUP.md` - detailed setup, tools, env, and safety docs.
- `docs/DESIGN.md` - product boundary and mechanics.
- `docs/PUBLISHING.md` - versioning and release-promotion policy.
- `package.json` - explicit npm `files` allowlist and package version.
- `server.mjs` - MCP tool registration and prompt construction.
- `src/claude-runner.mjs` - Claude process runner and job lifecycle.
- `src/state-store.mjs` - repo-scoped state and job persistence.
- `prompts/claude-review.md`, `prompts/claude-adversarial.md`,
  `prompts/claude-rescue.md` - compatibility prompt wrappers.
- `test/docs-rollout-contract.test.mjs` - docs/package contract tests.
- `test/runtime-contract.test.mjs` - source-level runtime contract tests.
- `test/job-lifecycle.test.mjs` - fake-Claude process lifecycle tests.
- `test/state-store.test.mjs` - state persistence tests.

## Specific Ideas

- Store distributable skill source files in a package-owned `skills/` directory
  and document copying them into `~/.codex/skills/`.
- Update `package.json` `files` to include `skills/` before publish.
- Make `claude_setup` report whether expected skill files exist in
  `~/.codex/skills`.
- Add an optional `repo_read_consent` tool argument to live Claude-launching
  tools so skills can pass allow-once or repo-allow after asking the user.
- Persist repo-level consent in `StateStore` `state.json`, not in job JSON
  files.
- Add inspect and revoke tools for repo-level consent.
- Keep allow-once as an in-memory request option. Do not persist it.
- Return an actionable no-launch message when consent is missing.

## Deferred Ideas

- Native Codex App approval UI integration.
- GitHub PR review bot.
- Hosted queue or remote MCP service.
- `$claude-design-review` naming or new design-review mode.
- Automatic hook review as a default.
- Full Codex chat-context transfer.
- TypeScript migration.
