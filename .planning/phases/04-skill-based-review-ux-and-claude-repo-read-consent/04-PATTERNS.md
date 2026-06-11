---
phase: "04"
slug: skill-based-review-ux-and-claude-repo-read-consent
status: mapped
created: 2026-06-11
---

# Phase 4 - Pattern Map

## Files to Create

| File | Role | Closest analog |
| --- | --- | --- |
| `skills/claude-review/SKILL.md` | Codex skill wrapper for implementation-risk review | `prompts/claude-review.md` for workflow intent; GSD skill files under `~/.codex/skills/*/SKILL.md` for structure. |
| `skills/claude-adversarial/SKILL.md` | Codex skill wrapper for adversarial critique | `prompts/claude-adversarial.md`. |
| `skills/claude-rescue/SKILL.md` | Codex skill wrapper for rescue | `prompts/claude-rescue.md`. |
| `skills/claude-setup/SKILL.md` | Codex skill wrapper for setup diagnostics | `claude_setup` tool docs in README/setup. |

## Files to Modify

| File | Role | Existing pattern to follow |
| --- | --- | --- |
| `package.json` | Package allowlist | Add new runtime asset dirs to `files`, as already done for `src/`, `hooks/`, `prompts/`, and selected docs. |
| `README.md` | Primary setup path | Current "Team rollout" section leads with the standard UX and then references MCP tools. Keep that shape but make skills the standard path. |
| `docs/SETUP.md` | Detailed setup | Existing command blocks and tool tables. Add skill install/diagnostic steps without making hooks default. |
| `docs/DESIGN.md` | Product mechanics | Existing context contract and codex-plugin-cc mapping. Add skill/consent mechanics. |
| `docs/PUBLISHING.md` | Release/package policy | Existing versioning policy and package checklist. Mention skills as package assets if needed. |
| `prompts/*.md` | Compatibility aliases | Existing slash prompts are long enough to leak instructions. Keep only thin alias copy. |
| `server.mjs` | MCP tool schemas and setup output | Existing `server.registerTool` shape, `setupReport`, and review/rescue option construction. |
| `src/state-store.mjs` | Repo-scoped persistence | Existing `state.json` `config` object and StateStore methods. Add consent accessors here. |
| `src/claude-runner.mjs` | Process runner | Existing fake-Claude-testable runner. Keep consent outside low-level spawn where possible. |
| `test/docs-rollout-contract.test.mjs` | Docs/package contracts | Existing assertIncludes/assertPackageCovers helpers. |
| `test/runtime-contract.test.mjs` | Source contracts | Existing source-level regex assertions for tool boundaries. |
| `test/job-lifecycle.test.mjs` | Fake process lifecycle | Existing fake Claude binary and runner factory. Use to prove no launch when blocked. |
| `test/state-store.test.mjs` | State persistence | Existing temp repo and temp state root helpers. |

## Concrete Patterns

### MCP tool registration

Use the current `server.registerTool` pattern:

- Tool name is a string.
- Metadata contains `title`, `description`, and `inputSchema`.
- Handler returns `{ content: [{ type: "text", text }], isError }`.

### StateStore

State is repo-scoped and canonicalized by repo realpath hash. New repo-level
consent should live in `state.json`, not in job files, and should be accessed
through public `StateStore` methods.

### Runner tests

`test/job-lifecycle.test.mjs` already proves process launch with a fake Claude
binary. Add a fake spawn counter or sentinel env/output so missing-consent tests
can prove no process was launched.

### Docs tests

`test/docs-rollout-contract.test.mjs` already combines README/setup/design and
asserts package coverage. Extend this pattern rather than adding a new docs
test harness.

## Anti-Patterns to Avoid

- Do not implement consent only in skill text. Direct MCP calls must also be
  gated.
- Do not persist allow-once consent.
- Do not let repo-read consent imply `allow_write`.
- Do not make hooks part of default onboarding.
- Do not add a new design-review name in this phase.
- Do not publish new runtime assets without updating `package.json` `files`.
