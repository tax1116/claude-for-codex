---
name: "claude-review"
description: "Run a read-only Claude Code implementation-risk review from Codex"
metadata:
  short-description: "Claude implementation-risk review"
---

Use this skill when the user asks for a Claude review, `$claude-review`, or an
implementation-risk second opinion.

Call the `claude.claude_review` MCP tool. Pass:

- `base` only when the user names a git ref.
- `focus` only when the user names a risk area.
- `background: true` only for broad or multi-file diffs.

Keep the launcher thin. The MCP tool contract owns read-only policy, severity
format, failure guidance, and consent enforcement. Summarize Claude's result
with the tool output as the source of truth, and preserve the read-only boundary.
