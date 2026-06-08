Run a Claude Code review of the current changes by calling the `claude.claude_review` tool.

- If the user supplied a base git ref (e.g. `main`), pass it as the `base` argument.
- For multi-file diffs, pass `background: true`, then use `claude.claude_status` and
  `claude.claude_result` to retrieve the outcome.

Summarize Claude's findings for me, grouped by severity.
