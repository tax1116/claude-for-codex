# Codebase Map: Conventions

Date: 2026-06-08

## Language Style

The current code uses ESM JavaScript.

- File extension: `.mjs`.
- Imports use `import ... from`.
- Node built-ins use `node:` specifiers.
- Variables and functions use `camelCase`.
- Constants use uppercase names when they represent configuration-like values.
- Semicolons are used.
- Indentation is two spaces.

## Module Shape

The project currently favors small local helper functions over classes.

Examples in `server.mjs`:

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

This style is simple and readable, but future feature growth should extract
shared concerns before adding more responsibilities to `server.mjs`.

## MCP Tool Definitions

Tools are registered with `server.registerTool`.

Each tool definition includes:

- `title`
- `description`
- `inputSchema`
- async handler

`zod` is used for user-facing input schemas. Keep schema descriptions concrete
because they become part of the model-facing tool contract.

## Prompt Construction

Prompts are currently constructed as strings in `server.mjs`.

Existing prompt helper conventions:

- Keep review-base logic in `reviewRangeInstruction`.
- Keep untracked-file review guidance in a shared constant.
- Build specialized review prompts by composing shared instructions.
- Make read-only expectations explicit in the prompt.

Future prompt growth should avoid long duplicated prompt strings across tools.

## Safety Conventions

Read-only is the default.

- Allow only file reads, grep/glob, and read-style git commands.
- Disallow edit/write tools by default.
- Require an explicit `allow_write` path for write-capable rescue work.
- Document any path that passes `--dangerously-skip-permissions`.

Hook behavior should remain opt-in and obvious in docs.

## Job Status Conventions

Current statuses:

- `running`
- `done`
- `error`
- `cancelled`

Current formatting is human-readable text returned through MCP. If future code
adds machine-readable status, it should preserve the existing human text until
the tool contract is intentionally versioned.

## Documentation Style

Docs are Markdown and mostly written in concise explanatory sections.

Conventions already present:

- Use command blocks for setup snippets.
- Use tables for tool/config reference.
- Call out warnings near risky hook or write-enabled behavior.
- State unofficial/non-affiliation language clearly.
- Keep installation paths explicit and require absolute paths in Codex config.

## Git Conventions

This workspace uses `dev` as the feature integration branch and protects
`master`.

Current branch naming in Codex work uses the `codex/` prefix.

Commit messages in this workspace follow the Lore protocol from `AGENTS.md`:

- Intent line first.
- Add trailers for constraints, rejected alternatives, confidence, scope risk,
  directive, tested, and not-tested when useful.

## Ignore Conventions

The repository ignores local/editor/runtime artifacts.

Important ignored GSD/runtime paths:

- `.planning/logs/`
- `.planning/.gsd-trace.jsonl`
- `.planning/.lock*`
- `.planning/active-workstream`

Stable planning docs under `.planning/codebase/` are intentionally tracked.

## Testing Conventions

The current branch treats syntax check, lint, and package dry-run as the core
verification loop.

For future behavior changes:

- Add focused tests before refactoring shared behavior.
- Mock or fake the Claude CLI instead of requiring a live Claude account.
- Keep tests deterministic and local.
- Preserve package dry-run checks so the npm artifact does not silently omit new
  runtime files.

## Dependency Conventions

The package intentionally keeps dependencies small.

Before adding a dependency, prefer:

- Node built-ins.
- Existing MCP SDK capabilities.
- Existing local helpers.

New dependencies should be justified by a real boundary or correctness need,
not convenience alone.
