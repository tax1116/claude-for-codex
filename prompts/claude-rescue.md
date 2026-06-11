# /claude-rescue

compatibility alias for `$claude-rescue`.

Delegate the user's explicit task to Claude Code by calling the `claude.claude_rescue` MCP tool.

- Put the task description in `task`.
- To continue the previous Claude session in this repo, pass `resume: true`.
- Only pass `allow_write: true` if the user clearly wants Claude to edit files.
- Prefer `background: true` for anything that may take a while, then check
  `claude.claude_status` and fetch `claude.claude_result`.

For team rollout docs, prefer the `$claude-rescue` skill.
