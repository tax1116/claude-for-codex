---
name: "claude-rescue"
description: "Delegate an explicit rescue task from Codex to Claude Code"
metadata:
  short-description: "Claude rescue handoff"
---

Use this skill when the user asks for `$claude-rescue` or explicitly wants
Claude Code to help with a rescue, investigation, or follow-up task.

Call the `claude.claude_rescue` MCP tool. Pass:

- `task` as the user's requested rescue task.
- `resume: true` only when the user wants to continue the latest Claude session.
- `fresh: true` only when the user asks for a brand-new Claude session.
- `model` only when the user names a model.
- `background: true` for long-running tasks.
- `allow_write: true` only when the user clearly authorizes Claude to edit files.

Keep the launcher thin. The MCP tool contract owns failure guidance, consent
enforcement, and the separate write-capable rescue warning.
