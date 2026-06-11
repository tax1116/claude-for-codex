---
phase: "04"
slug: skill-based-review-ux-and-claude-repo-read-consent
status: researched
created: 2026-06-11
---

# Phase 4 - Research

## Summary

Phase 4 should be split into two executable slices:

1. Add the skill-first workflow surface and compatibility treatment for existing
   slash prompts.
2. Add the repo-read consent state and shared launch gate for all live Claude
   runs.

This keeps UX packaging changes separate from runtime safety changes while still
delivering one coherent v2 trust model.

## Architectural Responsibility Map

| Area | Current owner | Phase 4 responsibility |
| --- | --- | --- |
| MCP tool registration | `server.mjs` | Add setup skill diagnostics and consent/status/revoke surfaces. |
| Prompt and review policy | `server.mjs` | Remain source of truth for severities, read-only language, and review focus. |
| Process launch | `src/claude-runner.mjs` | Continue to own spawning, jobs, and cancellation. Do not embed user-facing consent copy here unless needed for no-launch results. |
| Repo state | `src/state-store.mjs` | Persist repo-level consent alongside existing repo-scoped state. |
| Team UX wrappers | `prompts/*.md` | Become optional compatibility aliases. |
| Codex skills | `skills/*/SKILL.md` | Become the standard team-facing entry points. |
| Docs and package contract | `README.md`, `docs/*`, `package.json`, tests | Teach skill-first setup and ensure new files ship. |

## Current Implementation Findings

`server.mjs` registers all MCP tools directly and uses `createClaudeRunner()` for
Claude execution. Review and adversarial review construct prompts in `server.mjs`
and pass `allowWrite: false`. Rescue can pass `allowWrite: true` only when
`allow_write` is set.

`src/claude-runner.mjs` owns:

- `buildArgs`
- read-only `--allowedTools` and `--disallowedTools`
- `startJob`
- foreground/background execution
- status/result/cancel formatting

`src/state-store.mjs` owns repo-root resolution, canonical repo state paths, job
read/write/list, latest completed review lookup, and latest Claude session
storage. Its `state.json` already has a `config` object, which is the right
place for repo-level consent metadata.

`test/job-lifecycle.test.mjs` uses a fake Claude binary and is the best test
surface for "does a Claude process start?" behavior. `test/state-store.test.mjs`
is the best place for persisted consent state tests. `test/docs-rollout-contract.test.mjs`
already locks packaging and docs behavior.

## Recommended Implementation Shape

### Skill surface

- Add package-owned source skills under `skills/claude-review/`,
  `skills/claude-adversarial/`, `skills/claude-rescue/`, and
  `skills/claude-setup/`.
- Keep each `SKILL.md` short. The skills should gather only user-facing
  arguments, handle the repo-read consent choice, and call the matching MCP
  tool. They should not duplicate the full review prompt.
- Keep `prompts/*.md` only as optional compatibility aliases. Their copy should
  point users toward the skill path when skills are installed.
- Add `skills/` to `package.json` `files`.
- Extend docs contract tests so package dry-run cannot omit skills.

### Consent gate

- Add a shared consent policy in `server.mjs` or a small helper module if the
  server file becomes too noisy.
- Extend current Claude-launching tool schemas with an optional
  `repo_read_consent` enum:
  - `allow_once`
  - `allow_repo`
  - `cancel`
- If repo-level consent already exists, launch without asking again.
- If `repo_read_consent` is `allow_once`, launch but do not persist.
- If `repo_read_consent` is `allow_repo`, persist repo-level consent before
  launch.
- If consent is missing or `repo_read_consent` is `cancel`, return a no-launch
  message and do not call `startJob` or `startBackground`.
- Add tools to inspect and revoke repo-level consent, likely
  `claude_consent_status` and `claude_consent_revoke`.
- Keep `allow_write` separate. Repo-read consent is not write permission.

## Gaps and Risks

- MCP tools cannot assume Codex App will display a native approval sheet. Skills
  should implement the choice in workflow text and pass the decision into the
  MCP tool.
- If consent gating is implemented only in skills, direct MCP invocation can
  bypass it. The gate must live in the MCP server path.
- If the gate is implemented only in the runner, setup/status/result/cancel
  could be affected even though they do not launch Claude for repo reads. Gate
  only live Claude-launching paths.
- Persisting allow-once would violate the product promise. It must apply only to
  the current tool call.
- Updating slash prompts without tests could leave long prompt bodies visible in
  chat. Docs tests should lock the compatibility alias boundary.
- Adding `skills/` without updating `package.json` `files` would pass local
  tests but fail package distribution.

## Validation Architecture

| Requirement group | Test surface | Proof |
| --- | --- | --- |
| Skill files and packaging | `test/docs-rollout-contract.test.mjs`, `npm run pack:check` | Skills exist, docs mention skill-first setup, and package files cover `skills/`. |
| Setup diagnostics | `test/runtime-contract.test.mjs` or focused setup source test | `claude_setup` output names expected skills and missing/install path guidance. |
| Consent state | `test/state-store.test.mjs` | Repo-level consent persists, reads back, and revokes. |
| No-launch gate | `test/job-lifecycle.test.mjs` or runner/server contract test | Missing consent returns a no-launch result and fake Claude is not spawned. |
| Consent launch choices | fake-Claude lifecycle tests | `allow_once` launches without persistence; `allow_repo` launches and persists; revoke blocks the next launch. |
| Write boundary | `test/runtime-contract.test.mjs` | `allow_write` remains separate from repo-read consent. |
| Docs and product copy | docs contract tests | Copy says "repo diff, related files, selected planning docs" and avoids implying full Codex chat transfer. |

## Verification Strategy

- `npm run ci`
- `npm run pack:check`
- `rg "skills/|claude_consent|repo_read_consent|allow_once|allow_repo|selected planning docs|0.x.y" README.md docs server.mjs src test package.json skills`
- `git diff --check`

## Out of Scope for This Phase

- Live external Claude smoke tests in CI.
- Native Codex approval UI.
- GitHub review bot.
- Hook-first automation.
- TypeScript migration.
- Public `1.0.0` release.
