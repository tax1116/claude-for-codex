# Publishing to your GitHub repo

## Naming

Recommended repo name: **`claude-for-codex`** ("Claude, for Codex").
Alternatives: `codex-claude-mcp` (most descriptive), `cc-plugin-codex`.
Avoid names that imply an official OpenAI/Anthropic package; keep "unofficial" in the README.

## Ownership

- Copyright holder: `tax1116`
- Repository URL: `https://github.com/tax1116/claude-for-codex`
- License: Apache-2.0

## Initial repo bootstrap only

Use this only when creating a brand-new repository. Ongoing releases in this
repo use the `dev` to `master` PR promotion flow below.

### Option A - GitHub CLI (create + push in one step)

```bash
cd claude-for-codex
git init -b main
git add -A
git commit -m "Initial commit: call Claude Code from Codex via MCP"
gh repo create claude-for-codex --public --source=. --remote=origin --push
```

Use `--private` instead of `--public` for a private repo.

### Option B - Manual

Create an empty repo on github.com (no README/license), then:

```bash
cd claude-for-codex
git init -b main
git add -A
git commit -m "Initial commit: call Claude Code from Codex via MCP"
git remote add origin https://github.com/tax1116/claude-for-codex.git
git push -u origin main
```

## Ongoing release promotion

Promote verified `dev` to `master` through a PR promotion, not by pushing
directly to `master`.

1. Confirm `dev` is green and contains only release-intended work.
2. Open or update a pull request from `dev` to `master`.
3. Wait for CI, branch protection, review, and conversation-resolution checks.
4. Merge the promotion PR into `master`.
5. After merge, do not delete `dev`; delete only short-lived feature/topic
   branches when they are no longer needed.

Branch protection should keep both long-lived branches safe: `master` should
require PRs and CI before release promotion, and `dev` should require CI for
feature/topic integration.

## Recommended GitHub settings

- **Description:** Unofficial MCP server that lets OpenAI Codex CLI call Claude Code
- **Topics:** `mcp`, `codex`, `claude-code`, `cli`, `ai`, `code-review`

## Pre-push checklist

- [ ] Ownership metadata checked (`LICENSE`, `NOTICE`, `package.json`)
- [ ] `node_modules` excluded (handled by `.gitignore`)
- [ ] `package-lock.json` committed
- [ ] README states the project is unofficial
- [ ] Authenticate the push with your own GitHub credentials / token

## Release-date revalidation

Before publishing to npm, tagging a release, or treating docs as release-ready,
re-check time-sensitive external claims against official docs for the release
date:

| Claim area | What to re-check |
| --- | --- |
| Codex CLI/MCP config | current Codex MCP config shape, config file path, and timeout behavior |
| hook behavior | current Stop hook event names, hook enable/disable behavior, and `/hooks` UI |
| Claude Code CLI behavior | install/auth commands, `claude -p`, JSON output, resume, and permission flags |
| model aliases | accepted Claude Code model aliases for the release date |
| billing/Agent SDK usage | current billing and Agent SDK usage language |
| npm package setup | `npm ci`, `npm run ci`, package contents, and dry-run tarball output |

Do not claim those external behaviors are current unless the official docs and
local smoke checks were reviewed during the release work.
