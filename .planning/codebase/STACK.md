# Codebase Map: Stack

Date: 2026-06-08

## Runtime

This repository is a small Node.js package that exposes a Codex-to-Claude MCP
server.

- Primary runtime: Node.js.
- Module format: ESM (`"type": "module"`).
- Entry point: `server.mjs`.
- CLI binary: `claude-for-codex` mapped to `./server.mjs`.
- Required Node version: `>=18.18`.
- Local version pins: `.node-version` and `.nvmrc`.
- CI compatibility matrix: Node `18.x`, `20.x`, and `22.x`.

There is no compile step in the current `dev` branch. The distributed artifact is
the source package itself.

## Language

The current implementation is JavaScript with `.mjs` files.

- `server.mjs` contains the MCP server, prompt construction, Claude process
  runner, and file-backed job store helpers.
- `hooks/review-gate.mjs` contains the optional Codex `Stop` hook.
- `prompts/*.md` provide slash-command prompt wrappers.

The docs describe Node + TypeScript as a planned team-ready direction, but the
current branch has no TypeScript compiler, `tsconfig.json`, `src/`, or generated
build output.

## Package Manager

The project uses npm.

- Lockfile: `package-lock.json`.
- Install command: `npm install` for local work, `npm ci` in CI.
- Package dry-run check: `npm pack --dry-run --cache ./.npm-cache`.

The local `.npm-cache/` directory is ignored and should remain a runtime/cache
artifact, not a source artifact.

## Main Dependencies

Runtime dependencies:

- `@modelcontextprotocol/sdk`: MCP server and stdio transport primitives.
- `zod`: tool input schema definitions.

Node built-ins used by the server:

- `node:child_process` for spawning `claude` and `git`.
- `node:crypto` for repo/job identifiers.
- `node:fs` for persisted job records.
- `node:path` and `node:os` for filesystem paths.

Dev dependencies:

- `eslint`
- `@eslint/js`

## Scripts

Current npm scripts:

- `npm start`: run `node server.mjs`.
- `npm run check`: syntax-check `server.mjs` and `hooks/review-gate.mjs`.
- `npm run lint`: run ESLint across the repo.
- `npm test`: run syntax checks and Node's built-in test suite.
- `npm run pack:check`: verify npm package contents.
- `npm run ci`: lint, test, and pack-check.

## Packaging

`package.json` limits the npm package to:

- `server.mjs`
- `hooks/`
- `prompts/`
- selected docs
- `README.md`
- `LICENSE`
- `NOTICE`

Any future runtime source directory, such as `src/`, must be added to the
`files` array before publishing.

## No Current Build Stack

The current branch does not use:

- TypeScript compiler.
- Bundler.
- Test transpilation.
- Database.
- Web server.
- Browser frontend.
- Docker runtime.

That keeps the current stack simple, but it also means structural boundaries
must be enforced by code organization and tests rather than build tooling.
