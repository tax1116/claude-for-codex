---
phase: 04-skill-based-review-ux-and-claude-repo-read-consent
plan: "01"
subsystem: skill-surface
tags: [skills, prompts, packaging, setup]

provides:
  - Package-owned Codex skill launchers for Claude workflows
  - Slash prompts demoted to compatibility aliases
  - Setup diagnostics for expected Codex skill installation paths
  - Package contract coverage for skills/
affects: [phase-4, skills, docs, prompts, package, tests]

tech-stack:
  added: []
  patterns:
    - Codex skills are thin launchers over MCP tools
    - MCP tools remain the source of truth for policy and safety
    - npm package files must include packaged skill assets

key-files:
  created:
    - skills/claude-review/SKILL.md
    - skills/claude-adversarial/SKILL.md
    - skills/claude-rescue/SKILL.md
    - skills/claude-setup/SKILL.md
  modified:
    - README.md
    - docs/SETUP.md
    - docs/DESIGN.md
    - docs/PUBLISHING.md
    - package.json
    - prompts/claude-review.md
    - prompts/claude-adversarial.md
    - prompts/claude-rescue.md
    - server.mjs
    - test/docs-rollout-contract.test.mjs
    - test/runtime-contract.test.mjs

key-decisions:
  - "Use `$claude-review`, `$claude-adversarial`, `$claude-rescue`, and `$claude-setup` as the standard team-facing workflow surface."
  - "Keep slash prompts available only as compatibility aliases."
  - "Keep skills thin and centralize behavior, safety, and failure guidance in MCP tools."

patterns-established:
  - "New runtime skill assets must be included in `package.json.files` and proven by `npm pack --dry-run`."
  - "`claude_setup` should report expected skill paths so MCP availability and skill installation can be diagnosed separately."

requirements-completed: [SKILL-01, SKILL-02, SKILL-03, SKILL-04]

implementation-commit: 52666a8
duration: 35min
completed: 2026-06-11
---

# Phase 4 Plan 1: Codex Skill Surface And Compatibility Aliases Summary

**Codex skills are now the documented standard workflow surface for Claude
review, adversarial critique, rescue, and setup.**

## Korean Summary

Phase 4-1에서는 기존 `/claude-review` 중심 문서 흐름을 `$claude-review`
중심의 Codex skill 흐름으로 전환했습니다. skill은 긴 리뷰 프롬프트를 복제하지
않고 MCP 도구를 호출하는 얇은 launcher로만 두었습니다.

slash prompt는 제거하지 않고 compatibility alias로 유지했습니다. 그래서 기존에
`/claude-review`, `/claude-adversarial`, `/claude-rescue`를 쓰던 사용자는 계속
쓸 수 있지만, 팀 rollout 문서는 `$claude-*` skill을 표준 경로로 설명합니다.

또한 `claude_setup`이 `~/.codex/skills/*/SKILL.md` 설치 상태와 복사 명령을
보고하도록 바꿔서, MCP 서버는 떠 있는데 skill이 안 보이는 상황을 바로 진단할
수 있게 했습니다.

## Accomplishments

- Added four package-owned Codex skill launchers.
- Added `skills/` to the npm package allowlist.
- Updated README and setup docs to teach `$claude-*` skills before MCP details.
- Updated design docs to state that skills are launchers and MCP tools remain
  the behavior source of truth.
- Rewrote slash prompts as compatibility aliases.
- Added docs/runtime contract tests for skill files, package coverage, prompt
  alias language, and setup diagnostics.

## Files Created/Modified

- `skills/claude-review/SKILL.md`
- `skills/claude-adversarial/SKILL.md`
- `skills/claude-rescue/SKILL.md`
- `skills/claude-setup/SKILL.md`
- `README.md`
- `docs/SETUP.md`
- `docs/DESIGN.md`
- `docs/PUBLISHING.md`
- `package.json`
- `prompts/claude-review.md`
- `prompts/claude-adversarial.md`
- `prompts/claude-rescue.md`
- `server.mjs`
- `test/docs-rollout-contract.test.mjs`
- `test/runtime-contract.test.mjs`

## Deviations from Plan

None - plan executed exactly as written.

**Total deviations:** 0 auto-fixed. **Impact:** None.

## Verification

- `npm test` - passed with 28 tests.
- `npm run ci` - passed lint, tests, and package dry-run.
- `npm pack --dry-run --cache ./.npm-cache` - included all four
  `skills/*/SKILL.md` files.
- `rg "compatibility alias|skills/|claude_setup|claude_review|claude_adversarial_review|claude_rescue" README.md docs prompts skills test server.mjs package.json` - found expected coverage.
- `rg "claude-design-review|\\$claude-design-review" README.md docs prompts skills server.mjs test` - returned no matches.
- `git diff --check` - passed.

## Self-Check: PASSED

## Next Phase Readiness

Plan 04-02 can build on this surface by adding the shared repo-read consent gate
to the MCP tools and then updating these skills to pass the user's
`repo_read_consent` choice.

---
*Phase: 04-skill-based-review-ux-and-claude-repo-read-consent*
*Completed: 2026-06-11*
