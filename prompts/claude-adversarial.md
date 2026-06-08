Run an adversarial Claude review by calling the `claude.claude_adversarial_review` tool.

- Pass any focus text the user provided (e.g. "auth", "race conditions") as `focus`.
- Pass a `base` ref if the user named one.
- Use `background: true` for large diffs and report back via `claude.claude_result`.

Present the challenges to the design, ranked by risk.
