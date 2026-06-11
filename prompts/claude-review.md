# /claude-review

compatibility alias for `$claude-review`.

Call the `claude.claude_review` MCP tool for a read-only implementation-risk review.

- `base`: pass a git ref only when the user names one.
- `focus`: pass any user-provided risk area; if none is provided, leave it unset.
- `background: true`: use only for broad or multi-file diffs, then report back through `claude.claude_status` and `claude.claude_result`.

Ask Claude to prioritize concrete implementation risks: missing tests, state edge cases, cancellation behavior, resume behavior, context limits, and failure modes.

When summarizing the result, group findings by `High`, `Medium`, and `Low`. If Claude reports a clean review, say `No high-confidence findings`. Preserve the read-only boundary and state that no files were edited. For team rollout docs, prefer the `$claude-review` skill.
