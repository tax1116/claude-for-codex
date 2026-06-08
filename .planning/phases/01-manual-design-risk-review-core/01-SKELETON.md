# Walking Skeleton - claude-for-codex

**Phase:** 1
**Generated:** 2026-06-08

## Capability Proven End-to-End

A Codex user can install the local MCP server, register it with an absolute
path, run a setup check, and deliberately invoke a read-only Claude review via
the slash-command-first path.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Runtime | Node.js ESM (`server.mjs`) | Matches the current implementation and package scripts without adding a build step in Phase 1. |
| Integration boundary | Local MCP stdio server launched by Codex | Gives Codex a stable tool surface while reusing the user's local Claude Code install and auth state. |
| Review entrypoint | `/claude-review` and `/claude-adversarial` prompts over MCP tools | Keeps team rollout learnable while preserving MCP tools as the reference interface. |
| Context model | Explicit prompt, allowed repo reads, read-style git state, selected current-phase planning docs, resumed Claude session output, and user focus only | Prevents false confidence about hidden Codex chat transfer. |
| Safety boundary | Read-only Claude tools for review/adversarial review | Preserves the default review promise and keeps write-capable rescue outside the standard path. |
| Verification target | Local source checks, lint, syntax check, and package dry-run | Proves the package contract without requiring live Claude credits in Phase 1. |

## Stack Touched in Phase 1

- [x] Project scaffold - existing npm package, lint, syntax check, package dry-run
- [x] Routing - MCP tool calls exposed through stdio and prompt wrappers
- [ ] Database - not applicable; this local plugin has no database
- [x] UI - slash-command prompt files as the user-facing Codex entrypoint
- [x] Deployment - documented local MCP registration with an absolute path

## Out of Scope (Deferred to Later Slices)

- Durable queue semantics beyond the current MCP server process lifetime
- Fake-Claude runner fixtures and deterministic job-store tests
- Package release smoke tests beyond local `npm pack --dry-run`
- Default hook enablement
- Write-capable rescue as a standard team workflow
- TypeScript migration

## Subsequent Slice Plan

- Phase 2: make background jobs, runner behavior, and package contents
  deterministic and testable without a live Claude account.
- Phase 3: guard optional hooks, write-capable rescue, and time-sensitive
  release claims for broader distribution.
