# Publishing to your GitHub repo

## Naming

Recommended repo name: **`claude-for-codex`** ("Claude, for Codex").
Alternatives: `codex-claude-mcp` (most descriptive), `cc-plugin-codex`.
Avoid names that imply an official OpenAI/Anthropic package; keep "unofficial" in the README.

## Ownership

- Copyright holder: `tax1116`
- Repository URL: `https://github.com/tax1116/claude-for-codex`
- License: Apache-2.0

## Option A — GitHub CLI (create + push in one step)

```bash
cd claude-for-codex
git init -b main
git add -A
git commit -m "Initial commit: call Claude Code from Codex via MCP"
gh repo create claude-for-codex --public --source=. --remote=origin --push
```

Use `--private` instead of `--public` for a private repo.

## Option B — Manual

Create an empty repo on github.com (no README/license), then:

```bash
cd claude-for-codex
git init -b main
git add -A
git commit -m "Initial commit: call Claude Code from Codex via MCP"
git remote add origin https://github.com/tax1116/claude-for-codex.git
git push -u origin main
```

## Recommended GitHub settings

- **Description:** Unofficial MCP server that lets OpenAI Codex CLI call Claude Code
- **Topics:** `mcp`, `codex`, `claude-code`, `cli`, `ai`, `code-review`

## Pre-push checklist

- [ ] Ownership metadata checked (`LICENSE`, `NOTICE`, `package.json`)
- [ ] `node_modules` excluded (handled by `.gitignore`)
- [ ] `package-lock.json` committed
- [ ] README states the project is unofficial
- [ ] Authenticate the push with your own GitHub credentials / token
