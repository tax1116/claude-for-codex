# /claude-adversarial

compatibility alias for `$claude-adversarial`.

Call the `claude.claude_adversarial_review` MCP tool for a read-only adversarial critique.

- `base`: pass a git ref only when the user names one.
- `focus`: pass any user-provided design concern; if none is provided, leave it unset.
- `background: true`: use only for broad or multi-file diffs, then report back through `claude.claude_status` and `claude.claude_result`.

Ask Claude to pressure-test architecture boundaries, complexity, assumptions, tradeoffs, and simpler alternatives.

When summarizing the result, group findings by `High`, `Medium`, and `Low`. If Claude reports a clean review, say `No high-confidence findings`. Preserve the read-only boundary and state that no files were edited. For team rollout docs, prefer the `$claude-adversarial` skill.
