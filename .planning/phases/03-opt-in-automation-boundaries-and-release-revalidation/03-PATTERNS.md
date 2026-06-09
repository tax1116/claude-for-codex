---
phase: "03"
slug: opt-in-automation-boundaries-and-release-revalidation
status: mapped
created: 2026-06-09
---

# Phase 3 - Patterns

## Existing Test Patterns

- Docs contract tests read user-facing markdown and assert required phrases.
- Runtime contract tests read `server.mjs` and `src/claude-runner.mjs` to lock
  tool shape and safety strings.
- Tests use Node built-ins only: `node:test`, `node:assert/strict`, and
  `readFileSync`.
- Package coverage is asserted through `package.json.files`, not by parsing npm
  dry-run output.

## Existing Documentation Patterns

- README leads with slash-command-first team rollout.
- Advanced hook setup is separated from default onboarding.
- Setup docs provide command snippets and warning blocks.
- Design docs explain product boundaries and caveats.
- Publishing docs hold repository ownership and release-prep guidance.
- Branching docs hold the current `dev` to `master` promotion policy.

## Existing Runtime Patterns

- Tool schemas live in `server.mjs`.
- Runner argument construction lives in `src/claude-runner.mjs`.
- Read-only review sets `allowWrite: false`.
- Write capability is expressed through `claude_rescue.allow_write` and
  `--dangerously-skip-permissions`.

## Planning Implications

- Phase 3 can stay docs/test focused; no runtime feature change is required.
- Add regression tests before wording changes so safety boundaries stay stable.
- Keep hook behavior tests out of scope unless the plan explicitly widens to v2.
- Release revalidation should be a durable doc checklist that future release
  work can follow, not a one-time chat note.
- If publishing docs mention branch flow, align them with `docs/BRANCHING.md`
  and avoid reintroducing a `main`-first fresh repo workflow as the active flow.
