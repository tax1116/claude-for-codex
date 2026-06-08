# Codebase Map: Structure

Date: 2026-06-08

## Top-Level Layout

```text
.
├── .github/workflows/ci.yml
├── .claude-for-codex.example.json
├── .env.example
├── .gitignore
├── .node-version
├── .nvmrc
├── LICENSE
├── NOTICE
├── README.md
├── docs/
├── eslint.config.js
├── hooks/
├── package.json
├── package-lock.json
├── prompts/
├── server.mjs
└── test/
```

Generated or local-only directories such as `node_modules/`, `.npm-cache/`,
`.idea/`, `.omc/`, and `.omx/` are not source surfaces.

## Runtime Entry Point

`server.mjs` is the current runtime entry point and published binary.

It contains:

- MCP server construction.
- MCP tool registration.
- Claude CLI process spawning.
- Prompt construction.
- Job persistence helpers.
- Session-resume helpers.
- Background job formatting and cancellation.

Changes that affect MCP behavior currently go through this file.

## Hooks

`hooks/review-gate.mjs` is the only hook implementation.

It is independent from `server.mjs` and can be installed in Codex config as a
`Stop` hook. It should remain optional and easy to remove.

Future hook work should keep this directory focused on lifecycle integrations,
not general MCP server logic.

## Prompt Wrappers

`prompts/` contains Codex custom prompt wrappers:

- `prompts/claude-review.md`
- `prompts/claude-adversarial.md`
- `prompts/claude-rescue.md`

These are user-interface assets for slash-command workflows. They should avoid
duplicating deep implementation details that belong in MCP tool handlers.

## Tests

`test/` contains Node built-in test runner files.

- `test/runtime-contract.test.mjs` checks the Phase 1 source-level contract for
  read-only Claude review prompts, setup diagnostics, failure guidance, and
  MCP tool schema shape.
- `test/docs-rollout-contract.test.mjs` checks the Phase 1 team rollout contract
  across README, setup/design docs, and slash prompt wrappers.

## Documentation

`docs/` contains durable project docs:

- `docs/SETUP.md`
- `docs/DESIGN.md`
- `docs/PUBLISHING.md`
- `docs/ADR-001-manual-mcp-first-hooks-opt-in.md`
- `docs/superpowers/specs/2026-06-08-claude-for-codex-review-design.md`

These files are source-of-truth material for team rollout decisions and public
setup instructions.

## Planning Artifacts

`.planning/codebase/` is the GSD codebase map directory.

Expected files:

- `STACK.md`
- `INTEGRATIONS.md`
- `ARCHITECTURE.md`
- `STRUCTURE.md`
- `CONVENTIONS.md`
- `TESTING.md`
- `CONCERNS.md`

Only stable planning docs should be committed here. Runtime GSD logs, locks,
trace files, and active workstream state are ignored by `.gitignore`.

## CI

`.github/workflows/ci.yml` is the only workflow file.

It runs the package checks on pull requests and pushes to `main`, `master`, and
`dev`, plus manual dispatch.

## Configuration Examples

`.claude-for-codex.example.json` and `.env.example` are examples only.

They should not contain real credentials or local absolute paths.

## Missing But Expected Future Structure

The current `dev` branch does not have:

- `src/`
- `dist/`
- `tsconfig.json`

The first core refactor PR introduces the direction of a separate state-store
boundary and tests. After that lands, this structure map should be refreshed so
future feature work targets the extracted modules rather than growing
`server.mjs` further.

## Ownership Boundaries

Practical edit boundaries today:

- MCP tool behavior: `server.mjs`.
- Hook behavior: `hooks/review-gate.mjs`.
- Slash UX: `prompts/*.md`.
- Public setup/product docs: `README.md` and `docs/*.md`.
- CI/package checks: `package.json`, `eslint.config.js`, and
  `.github/workflows/ci.yml`.
- GSD planning: `.planning/codebase/*.md`.
