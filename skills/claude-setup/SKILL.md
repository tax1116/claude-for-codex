---
name: "claude-setup"
description: "Check Claude Code and claude-for-codex setup from Codex"
metadata:
  short-description: "Claude bridge setup check"
---

Use this skill when the user asks for `$claude-setup`, setup verification, or a
Claude bridge health check.

Call the `claude.claude_setup` MCP tool and report the result directly. The MCP
tool owns the effective Claude binary, model, timeout, authentication guidance,
and expected Codex skill installation paths.
