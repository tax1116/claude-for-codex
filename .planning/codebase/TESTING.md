# Codebase Map: Testing

Date: 2026-06-08

## Current Test Surface

The current `dev` branch has a lightweight test surface.

`npm test` runs:

```bash
npm run check
```

`npm run check` runs syntax validation:

```bash
node --check server.mjs && node --check hooks/review-gate.mjs
```

There are no committed unit test files on the current `dev` branch.

## CI Verification

The full repository check is:

```bash
npm run ci
```

That expands to:

```bash
npm run lint && npm test && npm run pack:check
```

CI runs this on:

- Node `18.x`
- Node `20.x`
- Node `22.x`

The GitHub Actions workflow runs on pull requests, manual dispatch, and pushes
to `main`, `master`, and `dev`.

## Linting

ESLint is configured in `eslint.config.js`.

The lint command is:

```bash
npm run lint
```

Lint currently covers the whole repository.

## Package Verification

The package dry-run command is:

```bash
npm run pack:check
```

It runs:

```bash
npm pack --dry-run --cache ./.npm-cache
```

This is important because `package.json` uses an explicit `files` array. New
runtime files can pass local syntax checks but still be omitted from the npm
package if `files` is not updated.

## Manual Smoke Checks

Useful manual checks before a release:

```bash
npm run ci
node server.mjs
claude --version
```

When testing through Codex, verify:

- MCP server starts from an absolute path.
- `claude_setup` reports the expected Claude binary.
- `claude_review` can run read-only.
- `claude_status` lists recent jobs.
- `claude_result` returns a completed job.
- `claude_cancel` cancels a running background job while the MCP process is
  still alive.

## Hook Smoke Checks

For `hooks/review-gate.mjs`, useful local checks should cover:

- Empty stdin event.
- Event with `cwd`.
- Claude returning `OK`.
- Claude returning `BLOCK: ...`.
- Claude returning malformed JSON.
- Claude process timeout or launch failure.

The current branch does not yet automate those hook cases.

## Gaps

Current gaps:

- No automated unit tests for job-store persistence.
- No fake Claude binary or child-process test harness.
- No automated tests for foreground/background execution.
- No automated tests for cancellation after process restart.
- No automated tests for resume-session behavior.
- No contract tests around MCP tool schemas.
- No tests for hook exit-code behavior.
- No coverage reporting.

## Recommended Test Direction

Next behavior-oriented work should add deterministic Node tests before expanding
features.

Recommended approach:

- Extract state/job-store logic behind a small module.
- Add `node:test` tests for job read/write/list/last-session behavior.
- Inject or fake the Claude command runner for MCP tool tests.
- Use temporary directories for job-store tests.
- Keep tests free of real Claude, real Codex, and network dependencies.

## Verification Standard By Change Type

Docs-only change:

- `npm run ci` is sufficient when package/docs inclusion may change.
- Secret scan planning docs when adding `.planning` artifacts.

Server behavior change:

- Add or update focused tests.
- Run `npm run ci`.
- Manually smoke the relevant MCP tool when practical.

Hook behavior change:

- Add exit-code tests around the hook.
- Run `npm run ci`.
- Manually test the hook with representative stdin JSON.

Package/publishing change:

- Run `npm run pack:check`.
- Inspect package contents in the dry-run output.
