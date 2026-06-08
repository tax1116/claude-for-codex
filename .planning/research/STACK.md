# Stack Research

**Domain:** Brownfield Node.js MCP plugin for Codex-to-Claude Code review workflows
**Researched:** 2026-06-08
**Confidence:** HIGH for v1 runtime/package choices; MEDIUM for future TypeScript timing

## Recommendation

Standardize v1 on the current local-first Node.js ESM MCP server: `.mjs` source files, no compile step, npm packaging, `@modelcontextprotocol/sdk` for the MCP capability surface, `zod` for tool schemas, and Claude Code CLI invocation through `claude -p --output-format json`.

Do not introduce TypeScript, a bundler, a hosted queue, a database, or hook-first automation in v1. The project is already useful as a small npm package, and the highest-risk v1 work is behavioral correctness around job state, Claude invocation, cancellation, follow-up semantics, slash-command UX, and packaging completeness. Adding a build stack before those seams are tested would increase release risk without improving the core user workflow.

## Current Stack

### Core Technologies

| Technology | Version | Purpose | Confidence | Notes |
|------------|---------|---------|------------|-------|
| Node.js | `>=18.18` | Runtime for MCP server, hook script, CLI package binary | HIGH | Matches `package.json`, `.mjs` implementation, npm distribution, and the reverse-direction reference plugin baseline. CI should continue proving Node 18, 20, and 22. |
| ECMAScript modules | Current Node ESM via `"type": "module"` | Module system for `server.mjs` and `hooks/review-gate.mjs` | HIGH | Current dev has ESM `.mjs` files with no TypeScript build, no `src/`, no `tsconfig.json`, and no generated `dist/`. |
| `@modelcontextprotocol/sdk` | `^1.0.0` | MCP server and stdio transport | HIGH | The MCP SDK is the right capability surface because Codex config launches local MCP servers and the official MCP SDK supports creating servers over local transports. |
| Claude Code CLI | User-installed local `claude` | Second-model review/rescue execution | HIGH | Current server shells out to `claude -p --output-format json`; Claude CLI docs cover print mode, JSON output, model selection, max turns, resume, MCP config, and tool restrictions. |
| npm package | npm with `package-lock.json` | Install, CI, publishing, package contents | HIGH | Keep package publishing simple and inspectable. `files` allowlist and `npm pack --dry-run` are release-critical. |

### Current Supporting Libraries

| Library | Version | Purpose | Confidence | Keep for v1? |
|---------|---------|---------|------------|--------------|
| `zod` | `^3.23.8` | Runtime validation and MCP tool input schemas | HIGH | Yes. It is already used and keeps tool contracts explicit without a TypeScript build. |
| Node built-ins | Node `child_process`, `crypto`, `fs`, `path`, `os` | Claude/git process management, repo hashing, file-backed job store | HIGH | Yes. Avoid replacing these with heavier dependencies until the job-store boundary is extracted and tested. |
| ESLint | `^9.39.4` with `@eslint/js` | Static linting | HIGH | Yes. Keep lint as part of `npm run ci`. |

### Current Development Tools

| Tool | Purpose | V1 Guidance |
|------|---------|-------------|
| `node --check` | Syntax validation for `server.mjs` and hook script | Keep and expand when adding runtime files. |
| `eslint .` | JavaScript linting | Keep flat ESLint setup; do not add a formatter dependency unless style churn becomes a real maintenance issue. |
| `npm pack --dry-run --cache ./.npm-cache` | Verify publish contents | Keep mandatory in CI and run before every release. The explicit package `files` array can omit new runtime files. |
| GitHub Actions Node matrix | Compatibility check across Node `18.x`, `20.x`, `22.x` | Keep. This is cheap and important for team machines. |

## V1 Target Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Node.js | `>=18.18`, tested on 18/20/22 | Runtime and npm binary | It matches Codex/Claude CLI user environments, keeps install friction low, and aligns with the reverse-direction reference plugin. |
| ESM JavaScript `.mjs` | No build step | Source format for server modules and hooks | Brownfield-compatible. Keeps v1 releases debuggable and avoids introducing `dist/` packaging risk. |
| `@modelcontextprotocol/sdk` | Keep current major constraint unless tested upgrade is needed | MCP server registration and stdio transport | MCP tools remain the capability surface. Use the official SDK instead of hand-rolling JSON-RPC or stdio protocol handling. |
| Claude Code CLI | Local authenticated `claude` binary | Review, adversarial review, rescue, and follow-up execution | Claude Code already exposes the required print-mode, JSON-output, resume, model, max-turn, and tool restriction flags. |
| Codex slash commands | Prompt files in `prompts/` | Standard team UX | Team rollout should make slash commands the default user path while MCP tools remain the underlying capability surface. |
| Optional Codex hooks | `hooks/review-gate.mjs` only | Opt-in lifecycle gate | Hooks should stay outside default setup because automatic Codex-to-Claude loops can consume usage and interrupt normal work. |

### V1 Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `zod` | Keep current `^3.23.8` unless migration-tested | MCP input schema validation | Use for every tool input contract. Avoid ad hoc shape checks in handlers. |
| `node:test` | Built into Node 18+ | Deterministic unit tests | Add first for job-store, prompt-building, status/result formatting, stale running jobs, and hook verdict parsing. No dependency needed. |
| `node:child_process` behind an internal runner | Built into Node | Claude and git invocation | Keep process spawning, but extract behind a testable runner so fake-Claude tests do not require a live Claude account. |
| File-backed JSON store | Built from Node `fs` | Repo-scoped task persistence | Keep for v1. It is enough for local background review, but document that cancellation is process-lifetime bounded. |

### V1 Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `npm run ci` | Canonical local and CI verification | Must include lint, tests, syntax checks, and pack dry-run. |
| `npm run pack:check` | Release safety | Treat failures or missing expected files as release blockers. Inspect output whenever `files` changes. |
| Fake Claude fixture script | Test runner helper, not a package dependency | Add a local executable fixture for tests that emits Claude-shaped JSON, errors, slow output, and malformed output. |

## Deferred Stack Choices

| Choice | Defer Until | Required Changes Before Adoption | Confidence |
|--------|-------------|----------------------------------|------------|
| TypeScript | After v1 behavior and module boundaries are stable | Add `typescript`, `tsconfig.json`, source layout, build output, sourcemap/debug story, test strategy, CI build step, and update package `files` so published artifacts include the right runtime files. | HIGH |
| `src/` plus generated `dist/` | Same as TypeScript or a deliberate JS modularization release | Update `bin`, `main` if added, `files`, syntax checks, tests, and README install/config paths. | HIGH |
| Bundler | Only if package startup or dependency footprint becomes a real problem | Prove MCP stdio behavior, shebang/bin behavior, source maps, license notices, and pack contents. | MEDIUM |
| Durable queue/database | Only if local file-backed jobs cannot meet actual usage | Define durable cancellation, stale process handling, migration, cleanup, and cross-process locking semantics. | HIGH |
| Shared hook/server runtime module | After server core extraction | Keep hook startup fast and independent; shared code must not require a running MCP server. | MEDIUM |
| Remote MCP transport or hosted service | Post-v1, only for a different product shape | Requires auth, tenancy, secrets, billing, logs, privacy, and support model. Not needed for local team rollout. | HIGH |

## Installation

V1 should not add install complexity.

```bash
npm install
npm run ci
```

For v1 development, avoid adding new runtime dependencies unless they remove a concrete risk that cannot be solved with the current stack. The first test expansion should use `node:test`, not Jest/Vitest, because the codebase currently has no build step and no transpilation.

## Alternatives Considered

| Recommended | Alternative | Why Not for V1 |
|-------------|-------------|----------------|
| ESM `.mjs` with no build | TypeScript immediately | The repo currently has no TS build/test/package strategy. Adding TS now creates packaging and CI work before the core MCP/job behavior is covered by tests. |
| `node:test` | Jest or Vitest | Extra dependency and config are unnecessary for process-runner and file-store tests. Add only if test ergonomics become limiting. |
| File-backed JSON job store | SQLite, Redis, hosted queue | Current product is local-first and repo-scoped. A service or database would overstate durability and complicate install. |
| Slash commands as rollout UX | Tool-only MCP invocation | MCP tools are the capability surface, but slash commands are more learnable for team rollout and mirror the reference plugin's UX. |
| Opt-in hook | Hook enabled by default | Hook automation can loop, block Codex unexpectedly, and consume Claude usage. Manual review should be the standard path. |
| Claude CLI process runner | Direct Anthropic API integration | The product promise is Claude Code as the local second-opinion CLI, using the user's local Claude Code auth and repo tooling. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| TypeScript as an unplanned partial migration | Current package is ESM `.mjs` with no build. Mixed TS without build/package changes will work locally but fail at publish or runtime. | Keep `.mjs` for v1; migrate deliberately later with package `files`, CI, and test updates. |
| Bundlers for v1 | They add bin/shebang, sourcemap, license, and pack-content risk without solving the core behavior gaps. | Plain Node ESM source package. |
| Hook-first onboarding | Hooks are harder to reason about, can create Codex/Claude loops, and can burn usage quickly. | Slash commands first; MCP tools underneath; hooks opt-in. |
| Default write-enabled rescue | `allow_write:true` passes a dangerous Claude permission mode and bypasses read-only review safety. | Read-only reviews by default; explicit, warned write rescue only. |
| Hosted services, remote queues, or databases | The v1 value is local-first review through the user's installed Claude Code CLI. Remote state adds auth, privacy, and operating burden. | Repo-scoped file-backed JSON jobs with honest durability limits. |
| Hand-rolled MCP protocol handling | Increases protocol drift risk. | Official `@modelcontextprotocol/sdk`. |
| Hidden dependency on full Codex chat context | Claude only sees explicit repo state, diffs, docs, and prompt focus. | Pass explicit artifacts and make context limits clear in tool docs. |

## Stack Patterns by Variant

**If adding v1 behavior:**
- Use existing ESM `.mjs` modules.
- Extract job-store, Claude runner, prompt builders, and MCP handlers into small JavaScript modules only when needed for tests.
- Update `package.json` `files` whenever adding runtime directories.
- Add targeted `node:test` coverage before refactoring behavior.

**If improving team UX:**
- Add or refine `prompts/*.md` slash-command wrappers.
- Keep slash commands as thin prompts over MCP tools.
- Keep MCP tool names stable because they are the durable capability surface.

**If improving hooks:**
- Keep hooks opt-in and reversible.
- Keep hook code small and fast.
- Share constants only after shared modules are package-safe and do not couple the hook to a long-running MCP server.

**If migrating to TypeScript later:**
- Create a deliberate migration phase.
- Decide whether runtime loads `dist/` or source through a loader.
- Update `bin`, package `files`, CI, syntax/type checks, tests, README paths, and `npm pack --dry-run` expectations in the same phase.

## Version Compatibility

| Component | Compatible With | Notes |
|-----------|-----------------|-------|
| Node.js `>=18.18` | Current `@modelcontextprotocol/sdk`, ESM `.mjs`, `node:test` | Keep CI matrix on Node 18/20/22 until dropping Node 18 is an explicit release decision. |
| Codex MCP config | Local stdio MCP server command in Codex config | Official OpenAI docs state Codex supports MCP server configuration through CLI or `~/.codex/config.toml`. |
| Claude Code CLI | `claude -p --output-format json --max-turns --model --resume` | Official Claude CLI docs cover the flags this project depends on. |
| npm package `files` | `server.mjs`, `hooks/`, `prompts/`, selected docs | Any future `src/`, `dist/`, `lib/`, `tests/fixtures` runtime fixture, or shared module path must be intentionally included or excluded. |

## Release Concerns

| Concern | Required Practice | Confidence |
|---------|-------------------|------------|
| Explicit package `files` array | Treat every new runtime path as a package change. Review `npm pack --dry-run` output before release. | HIGH |
| No compile step | Do not publish files that require transpilation. Syntax-check every runtime entry point. | HIGH |
| Optional hook packaging | Ensure `hooks/review-gate.mjs` remains included while hook docs stay opt-in. | HIGH |
| Slash-command packaging | Ensure `prompts/` stays included; slash commands are the standard team UX. | HIGH |
| Claude CLI availability | `claude_setup` should remain the supported readiness check; tests should not require live auth. | HIGH |

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| Current stack | HIGH | Verified from project docs, `package.json`, `server.mjs`, hook code, and README. |
| V1 target stack | HIGH | Aligns with existing working implementation and the externally checked MCP, Claude CLI, and reverse-direction plugin facts. |
| TypeScript deferral | HIGH | Current repo lacks TypeScript package/build/test infrastructure; adopting it safely requires coordinated package changes. |
| Future shared module boundaries | MEDIUM | The direction is clear, but exact file layout should be decided while extracting tests. |
| Hook strategy | HIGH | Project docs and current README consistently define hooks as opt-in due to loop and usage risks. |

## Sources

- OpenAI Docs MCP page: https://developers.openai.com/learn/docs-mcp — Codex supports MCP server configuration via CLI or `~/.codex/config.toml`; docs MCP is read-only documentation access. Confidence: HIGH.
- Anthropic Claude Code CLI reference: https://code.claude.com/docs/en/cli-usage — `-p`, `--output-format json`, `--max-turns`, `--resume`, `--model`, `--mcp-config`, and tool restriction flags are documented. Confidence: HIGH.
- Model Context Protocol SDK page: https://modelcontextprotocol.io/docs/sdk — TypeScript SDK is Tier 1; SDKs support creating MCP servers, clients, and local/remote transports. Confidence: HIGH.
- `openai/codex-plugin-cc` README: https://github.com/openai/codex-plugin-cc/blob/main/README.md — Reverse-direction UX reference uses slash commands for review, adversarial review, rescue, status, result, and cancel; Node `>=18.18`; background review recommended for multi-file changes. Confidence: HIGH.
- Local codebase files read on 2026-06-08: `.planning/PROJECT.md`, `.planning/codebase/STACK.md`, `.planning/codebase/INTEGRATIONS.md`, `.planning/codebase/CONCERNS.md`, `package.json`, `server.mjs`, `hooks/review-gate.mjs`, `README.md`. Confidence: HIGH.

---
*Stack research for: claude-for-codex*
*Researched: 2026-06-08*
