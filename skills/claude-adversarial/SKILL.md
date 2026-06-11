---
name: "claude-adversarial"
description: "Run a read-only adversarial Claude Code critique from Codex"
metadata:
  short-description: "Claude adversarial critique"
---

Use this skill when the user asks for `$claude-adversarial`, an adversarial
review, or a design/approach challenge from Claude.

Call the `claude.claude_adversarial_review` MCP tool. Pass:

- `base` only when the user names a git ref.
- `focus` only when the user names a design concern.
- `repo_read_consent` after the user chooses `allow once`, `always allow for this repository`, or `cancel`.
- `background: true` only for broad or multi-file diffs.

repo-read consent is not write permission.

Keep the launcher thin. The MCP tool contract owns review policy, output format,
read-only safety, failure guidance, and consent enforcement. Do not introduce a
separate design-review skill.
