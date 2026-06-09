<!-- GSD:project-start source:PROJECT.md -->

## Project

**claude-for-codex**

`claude-for-codex` is a local MCP plugin that lets Codex ask Claude Code for an
independent second opinion during review, design, and rescue workflows. It is
the conceptual reverse of `codex-plugin-cc`: instead of Claude Code calling
Codex, Codex can call Claude Code when another model perspective would improve
the work.

The first team rollout is not automatic review. The standard path is manual:
use a slash command or MCP tool when Codex's current context may be too narrow
and a separate design/risk review would help.

**Core Value:** Codex users can deliberately ask Claude Code for independent design critique and
implementation-risk review before committing to a plan or change.

### Constraints

- **Runtime**: Node.js MCP server - chosen to match the Codex/Claude plugin
  ecosystem and keep team installation simple.

- **Current implementation**: ESM JavaScript `.mjs` files - no TypeScript build
  exists on the current branch.

- **Local dependency**: Claude Code must be installed and authenticated on the
  user's machine.

- **Safety**: Read-only review is the default; write-capable rescue must remain
  explicit and warned.

- **Workflow**: Manual MCP/slash invocation is the standard rollout path; hooks
  remain optional.

- **Distribution**: npm package contents are controlled by the `files` array, so
  new runtime files must be added there before publishing.

- **Verification**: CI currently proves lint, syntax, and pack contents; future
  behavior changes need focused tests.

- **Repository flow**: Development proceeds from `dev` feature branches, with
  protected `master` for stable history.

- **Legal**: The project is unofficial and must avoid implying affiliation with
  OpenAI or Anthropic.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->

## Technology Stack

## Runtime

- Primary runtime: Node.js.
- Module format: ESM (`"type": "module"`).
- Entry point: `server.mjs`.
- CLI binary: `claude-for-codex` mapped to `./server.mjs`.
- Required Node version: `>=18.18`.
- Local version pins: `.node-version` and `.nvmrc`.
- CI compatibility matrix: Node `18.x`, `20.x`, and `22.x`.

## Language

- `server.mjs` contains the MCP server, prompt construction, Claude process runner, and file-backed job store helpers.
- `hooks/review-gate.mjs` contains the optional Codex `Stop` hook.
- `prompts/*.md` provide slash-command prompt wrappers.

## Package Manager

- Lockfile: `package-lock.json`.
- Install command: `npm install` for local work, `npm ci` in CI.
- Package dry-run check: `npm pack --dry-run --cache ./.npm-cache`.

## Main Dependencies

- `@modelcontextprotocol/sdk`: MCP server and stdio transport primitives.
- `zod`: tool input schema definitions.
- `node:child_process` for spawning `claude` and `git`.
- `node:crypto` for repo/job identifiers.
- `node:fs` for persisted job records.
- `node:path` and `node:os` for filesystem paths.
- `eslint`
- `@eslint/js`

## Scripts

- `npm start`: run `node server.mjs`.
- `npm run check`: syntax-check `server.mjs` and `hooks/review-gate.mjs`.
- `npm run lint`: run ESLint across the repo.
- `npm test`: run syntax checks and Node's built-in test suite.
- `npm run pack:check`: verify npm package contents.
- `npm run ci`: lint, test, and pack-check.

## Packaging

- `server.mjs`
- `hooks/`
- `prompts/`
- selected docs
- `README.md`
- `LICENSE`
- `NOTICE`

## No Current Build Stack

- TypeScript compiler.
- Bundler.
- Test transpilation.
- Database.
- Web server.
- Browser frontend.
- Docker runtime.

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

## Language Style

- File extension: `.mjs`.
- Imports use `import ... from`.
- Node built-ins use `node:` specifiers.
- Variables and functions use `camelCase`.
- Constants use uppercase names when they represent configuration-like values.
- Semicolons are used.
- Indentation is two spaces.

## Module Shape

- `repoRoot`
- `repoKey`
- `jobsDir`
- `writeJob`
- `readJob`
- `listJobs`
- `lastSession`
- `buildArgs`
- `startJob`
- `runForeground`
- `startBackground`

## MCP Tool Definitions

- `title`
- `description`
- `inputSchema`
- async handler

## Prompt Construction

- Keep review-base logic in `reviewRangeInstruction`.
- Keep untracked-file review guidance in a shared constant.
- Build specialized review prompts by composing shared instructions.
- Make read-only expectations explicit in the prompt.

## Safety Conventions

- Allow only file reads, grep/glob, and read-style git commands.
- Disallow edit/write tools by default.
- Require an explicit `allow_write` path for write-capable rescue work.
- Document any path that passes `--dangerously-skip-permissions`.

## Job Status Conventions

- `running`
- `done`
- `error`
- `cancelled`

## Documentation Style

- Use command blocks for setup snippets.
- Use tables for tool/config reference.
- Call out warnings near risky hook or write-enabled behavior.
- State unofficial/non-affiliation language clearly.
- Keep installation paths explicit and require absolute paths in Codex config.

## Git Conventions

- Intent line first.
- Add trailers for constraints, rejected alternatives, confidence, scope risk, directive, tested, and not-tested when useful.

## Ignore Conventions

- `.planning/logs/`
- `.planning/.gsd-trace.jsonl`
- `.planning/.lock*`
- `.planning/active-workstream`

## Testing Conventions

- Add focused tests before refactoring shared behavior.
- Mock or fake the Claude CLI instead of requiring a live Claude account.
- Keep tests deterministic and local.
- Preserve package dry-run checks so the npm artifact does not silently omit new runtime files.

## Dependency Conventions

- Node built-ins.
- Existing MCP SDK capabilities.
- Existing local helpers.

<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

## Product Shape

- MCP tools for manual, on-demand use.
- Optional slash-command prompts for a friendlier team workflow.
- Optional Codex `Stop` hook for users who intentionally want automatic review.

## Current Runtime Architecture

See `.planning/codebase/ARCHITECTURE.md` for the full current runtime diagram.

## Main Module Responsibilities

- Environment configuration.
- Repo root and repo hash resolution.
- Job path and job JSON persistence helpers.
- Last Claude session persistence.
- Live child-process tracking for cancellation.
- Claude CLI argument construction.
- Foreground/background execution.
- Prompt construction.
- MCP server and tool registration.

## MCP Tool Layer

- `claude_setup`
- `claude_review`
- `claude_adversarial_review`
- `claude_rescue`
- `claude_status`
- `claude_result`
- `claude_cancel`

## Claude Execution Flow

See `.planning/codebase/ARCHITECTURE.md` for the full Claude execution flow.

## State Model

- One JSON file per job.
- One `last-session.txt` per repo key.
- `live` map from task id to spawned child process.
- `id`
- `kind`
- `status`
- `cwd`
- `model`
- `background`
- `startedAt`
- `pid`
- `sessionId`
- `exitCode`
- `result`
- optional `endedAt`
- optional `costUsd`
- optional `numTurns`

## Safety Boundary

- `--allowedTools Read,Grep,Glob,Bash(git diff:*),Bash(git log:*),Bash(git status:*),Bash(git show:*)`
- `--disallowedTools Edit,Write,MultiEdit,NotebookEdit`

## Hook Architecture

See `.planning/codebase/ARCHITECTURE.md` for the full hook flow.

## Documentation Architecture

- `README.md`: product positioning and quick start.
- `docs/SETUP.md`: installation and usage.
- `docs/DESIGN.md`: feature mapping and mechanics.
- `docs/PUBLISHING.md`: repository/package publishing guidance.
- `docs/ADR-001-manual-mcp-first-hooks-opt-in.md`: design decision record.
- `docs/superpowers/specs/...`: earlier design/spec artifact.

<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `$gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `$gsd-debug` for investigation and bug fixing
- `$gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `$gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
