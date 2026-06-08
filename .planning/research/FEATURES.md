# Feature Research

**Domain:** Brownfield Node.js MCP plugin for Codex-to-Claude Code review workflows
**Researched:** 2026-06-08
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist for a local MCP bridge that asks Claude Code for a second opinion. Missing these makes the plugin feel incomplete or unsafe for team rollout.

| Feature | Why Expected | Complexity | Confidence | Dependencies | Notes |
|---------|--------------|------------|------------|--------------|-------|
| Slash-command-first onboarding for review workflows | Team members need a memorable manual entry point, not a hidden MCP-tool-only interface. | LOW | HIGH | Prompt files, MCP registration docs | v1 docs should lead with `/claude-review` and `/claude-adversarial`; direct MCP tool names remain reference material. |
| Read-only design critique | The core promise is an independent review of architecture, boundaries, complexity, assumptions, and simpler alternatives. | MEDIUM | HIGH | Claude CLI runner, repo/diff access, read-only tool allowlist | This is the primary v1 workflow. Frame it as "ask Claude to critique the design" rather than generic review automation. |
| Implementation-risk detection | Users need Claude to find missing tests, state edge cases, cancellation/resume gaps, context-limit risks, and failure modes before merge. | MEDIUM | HIGH | Review prompt, git diff/status inspection, optional focus/base args | This is the second half of the v1 promise and should be visible in README and slash-command copy. |
| Base-ref and focus controls | Review quality depends on narrowing the comparison and question. | LOW | HIGH | `base` and `focus` tool args | Keep examples like "review against main" and "focus on cancellation semantics" prominent. |
| Background job support for large reviews | Claude reviews can exceed normal Codex tool timeouts, so users need async task tracking. | MEDIUM | HIGH | File-backed job store, status/result tools, timeout docs | The reference plugin supports background review; this plugin already maps it through `background: true`. |
| Status and result retrieval | A background review is unusable unless users can see progress and fetch output later. | MEDIUM | HIGH | Job ids, repo-scoped store, result formatting | Treat `claude_status` and `claude_result` as supporting workflow features, not headline v1 marketing. |
| Cancel running review | Long or mistaken reviews need a local escape hatch. | MEDIUM | HIGH | Live process tracking, task id | Document current limitation: cancellation is reliable only while the MCP server still owns the child process. |
| Setup verification | Users need fast feedback that Claude Code is installed, authenticated, and reachable from Codex. | LOW | HIGH | `claude_setup`, Claude CLI availability | v1 docs should include a "verify setup" step before first review. |
| Read-only safety boundary by default | A review plugin must not edit code unless explicitly asked. | MEDIUM | HIGH | Claude allowed/disallowed tools, `allow_write` default false | Make this a product feature: Claude can inspect repo state, but normal review cannot write. |
| Clear failure messages for Claude launch/auth/timeouts | Local CLI auth and timeout problems are common in MCP bridges. | MEDIUM | MEDIUM | Runner errors, setup tool, docs | Current docs cover prerequisites; implementation should improve structured diagnosis as part of team readiness. |

### Differentiators (Competitive Advantage)

Features that make this more valuable than "just run Claude separately" or copying a diff into another chat.

| Feature | Value Proposition | Complexity | Confidence | Dependencies | Notes |
|---------|-------------------|------------|------------|--------------|-------|
| Independent model-perspective design review inside Codex | Codex can deliberately ask Claude for a second opinion without leaving the local workflow. | MEDIUM | HIGH | MCP server, slash prompts, Claude CLI JSON output | This is the sharp v1 positioning. The win is not more automation; it is better judgment at decision points. |
| Adversarial review mode with user-supplied focus | Users can ask Claude to challenge a risky area instead of producing a generic code review. | MEDIUM | HIGH | `claude_adversarial_review`, focus arg, prompt discipline | Use for architecture, migration, auth, race conditions, state, and test adequacy. |
| Repo-grounded review instead of pasted context | Claude can inspect git status, diffs, logs, and files directly through read-only tools. | MEDIUM | HIGH | Local repo access, allowed git commands, explicit prompt instructions | v1 must be honest that Claude sees repo artifacts, not the full Codex conversation. |
| Rescue as a secondary escalation path | When Codex gets stuck, Claude can analyze or attempt a solution from another angle. | HIGH | MEDIUM | `claude_rescue`, session state, optional write guard | Keep out of the main v1 docs flow except as "when review is not enough." |
| Session-aware continuation | Remembering Claude session ids can make later rescue/follow-up more coherent. | MEDIUM | MEDIUM | `last-session.txt`, `--resume`, result hints | Valuable, but current follow-up semantics are incomplete; do not overpromise in v1. |
| Optional review gate hook | Advanced users can choose automatic stop-time review when actively monitored. | HIGH | MEDIUM | Codex hooks, hook script, prompt, timeout config | Differentiator for power users only. It is explicitly not the default team rollout. |
| Symmetric feature map to `codex-plugin-cc` | Users familiar with Claude-to-Codex flows can understand the reverse mapping quickly. | LOW | HIGH | README/design docs | Useful for context, but v1 should not let parity goals widen the launch scope. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that sound useful but create unsafe defaults, scope creep, or confusing product expectations for v1.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Hook-first team rollout | It feels powerful to auto-review every Codex stop. | Hooks can create Codex-to-Claude loops, burn usage, interrupt normal work, and are harder for teammates to reason about. | Make `/claude-review` and `/claude-adversarial` the v1 path; document hooks as opt-in advanced automation. |
| Automatic Claude review by default | Users may want continuous safety checks. | Surprise cost and latency undermine trust; noisy blocks make the plugin feel hostile. | Manual review at consequential decision points, with clear examples of when to invoke it. |
| Presenting all mapped tools as equally important | Parity with `codex-plugin-cc` looks comprehensive. | It obscures the core promise and makes v1 docs feel like an API catalog. | Lead with design critique and implementation-risk review; put setup/status/result/cancel/rescue in supporting sections. |
| Write-enabled rescue as a normal workflow | Claude could fix issues directly. | `allow_write:true` crosses the default safety boundary and can edit files under broad permissions. | Keep rescue read-only by default; require explicit user intent and prominent warnings for write access. |
| Claiming full Codex context transfer | Users want Claude to understand the whole Codex conversation. | Claude Code only sees the prompt and repo/files it can inspect; overstating context creates false confidence. | Pass explicit artifacts: base ref, focus, diff/repo state, planning docs, and user-provided context. |
| Durable queue semantics | Background jobs look like persistent tasks. | Current cancellation depends on the live MCP process; persisted JSON alone does not guarantee control over a child after restart. | Document process-lifetime limits; v2 can add stale-job detection and stronger process metadata. |
| Broad autonomous multi-agent orchestration | The plugin could become a general Codex/Claude team system. | It competes with Codex's own planning and increases failure surface before the core review use case is stable. | Keep Claude as a deliberate second-opinion reviewer, not the primary orchestrator. |
| Public plugin-marketplace polish before team proof | Wider distribution is tempting. | Packaging, branding, docs, support, and legal polish can distract from making the team workflow reliable. | Validate internally with manual slash-command review first; publish later with clearer guarantees. |

## Feature Dependencies

```text
Slash-command-first onboarding
    └──requires──> MCP server registration
                       └──requires──> Claude Code installed/authenticated

Design critique
    └──requires──> Repo-grounded read-only review
                       ├──requires──> git status/diff/show/log access
                       └──requires──> explicit prompt focus/base inputs

Implementation-risk detection
    └──requires──> Review prompt tuned for tests, state, cancellation, resume, context limits, and failure modes

Background review
    └──requires──> Job store
                       ├──requires──> status/result tools
                       └──enhances──> slash-command review for large diffs

Cancel
    └──requires──> live child-process tracking
                       └──limited-by──> MCP server process lifetime

Rescue
    └──requires──> review/result/session state
                       └──conflicts-with──> default read-only safety when allow_write is enabled

Optional hook gate
    └──requires──> stable manual review behavior
                       └──conflicts-with──> v1 hook-first team rollout

Follow-up
    └──requires──> explicit session-continuation contract
                       └──depends-on──> current `--resume` support and stored session ids
```

### Dependency Notes

- **Slash commands require MCP tools:** The prompt files are wrappers around `claude.claude_review`, `claude.claude_adversarial_review`, and `claude.claude_rescue`; they do not replace the MCP server.
- **Design critique requires explicit grounding:** v1 should pass or instruct Claude to inspect repo state, diff, planning docs, and user focus instead of implying invisible Codex chat transfer.
- **Background review requires status/result:** Async execution is only usable when the user can retrieve output predictably.
- **Cancel is not durable queue control yet:** The current live process map is enough for v1 documentation, but stale running jobs need v1.x/v2 hardening.
- **Hooks depend on a stable manual path:** Hook automation should follow proven manual review prompts, not lead rollout.
- **Follow-up depends on a clearer contract:** Claude CLI supports resume, and the plugin stores a session id, but product semantics need a dedicated follow-up workflow before this becomes a first-class feature.

## MVP Definition

### Launch With (v1)

Minimum viable team rollout centered on manual design and risk review.

- [ ] Slash-command-first docs for `/claude-review` and `/claude-adversarial` — makes the workflow learnable for teammates.
- [ ] MCP setup instructions and `claude_setup` verification — prevents first-use failures from looking like product failures.
- [ ] Read-only `claude_review` for design critique and implementation-risk detection — core product promise.
- [ ] Read-only `claude_adversarial_review` with `focus` and `base` examples — makes "second opinion" specific and useful.
- [ ] Background review guidance using status/result — required for large diffs and practical team use.
- [ ] Explicit safety language: read-only by default, write rescue exceptional, hooks opt-in — prevents dangerous mental models.
- [ ] Honest context contract — Claude reviews explicit repo artifacts and prompts, not the full Codex conversation.

### Add After Validation (v1.x)

Features to add after teammates use the manual review path successfully.

- [ ] Dedicated follow-up tool or docs pattern — add when users repeatedly need to ask Claude clarification questions after a result.
- [ ] Better large-diff/context-limit diagnosis — add when reviews fail or become too broad in normal team work.
- [ ] Stale running-job detection — add when background jobs survive MCP restarts in confusing states.
- [ ] Extracted job store and fake-Claude tests — add before expanding result/cancel/resume semantics.
- [ ] Shared prompt/config constants for hook and MCP review — add only after manual prompt behavior stabilizes.
- [ ] More structured result formatting — add if users need severity grouping or machine-readable review summaries beyond Claude's text.

### Future Consideration (v2+)

Features to defer until the team has validated the manual review workflow.

- [ ] Optional Codex `Stop` review gate as a documented advanced mode — keep off by default because automation can loop and drain usage.
- [ ] Stronger durable job/process management — only if background workflows become central rather than occasional.
- [ ] Write-capable rescue workflow with stronger guardrails — only if read-only rescue is insufficient and trust boundaries are explicit.
- [ ] Deeper slash-command suite for setup/status/result/cancel/follow-up — useful after the primary review commands are habitual.
- [ ] Public distribution polish and broader compatibility matrix — defer until internal rollout proves the value and support burden is understood.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority | Confidence |
|---------|------------|---------------------|----------|------------|
| Slash-command-first review docs | HIGH | LOW | P1 | HIGH |
| Design critique review lens | HIGH | MEDIUM | P1 | HIGH |
| Implementation-risk review lens | HIGH | MEDIUM | P1 | HIGH |
| Read-only safety boundary | HIGH | MEDIUM | P1 | HIGH |
| Setup verification | HIGH | LOW | P1 | HIGH |
| Background status/result workflow | HIGH | MEDIUM | P1 | HIGH |
| Adversarial focus review | HIGH | MEDIUM | P1 | HIGH |
| Cancel running jobs | MEDIUM | MEDIUM | P2 | HIGH |
| Rescue | MEDIUM | HIGH | P2 | MEDIUM |
| Follow-up/session continuation | MEDIUM | MEDIUM | P2 | MEDIUM |
| Hook review gate | MEDIUM | HIGH | P3 | MEDIUM |
| Write-enabled rescue | LOW | HIGH | P3 | MEDIUM |
| Durable queue semantics | LOW | HIGH | P3 | LOW |

**Priority key:**
- P1: Must have for v1 team rollout.
- P2: Useful after core manual review is validated.
- P3: Advanced or risky; defer until the product contract is stronger.

## v1/v2 Recommendations

### v1 Recommendation

Ship a narrow manual-review rollout: "Use Claude from Codex when you need design critique or implementation-risk detection." The recommended team path should be slash-command-first: copy prompt files, register the MCP server, run setup verification, then use `/claude-review` and `/claude-adversarial` at consequential design or pre-merge points.

The v1 docs should make supporting tools discoverable but secondary. `claude_status`, `claude_result`, and `claude_cancel` support large/background reviews; `claude_rescue` is an escalation path; hooks are explicitly advanced and optional.

### v2 Recommendation

Only after manual review becomes trusted, expand into stronger continuation and automation: first a clear follow-up/session workflow, then stale-job handling and better context-limit diagnostics, and finally optional hook-based gates for users who deliberately accept the cost and interruption risk.

Do not make automatic hooks, write-enabled rescue, or general autonomous orchestration part of the v1 default. Those features are powerful, but they weaken the initial trust model.

## Sources

- Project planning and codebase maps: `.planning/PROJECT.md`, `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/INTEGRATIONS.md`, `.planning/codebase/CONCERNS.md` (HIGH confidence).
- Current repo docs and prompts: `README.md`, `docs/DESIGN.md`, `docs/SETUP.md`, `prompts/claude-review.md`, `prompts/claude-adversarial.md`, `prompts/claude-rescue.md` (HIGH confidence).
- `openai/codex-plugin-cc` README: https://github.com/openai/codex-plugin-cc/blob/main/README.md (MEDIUM confidence for reference feature parity and onboarding patterns; externally checked 2026-06-08).
- Anthropic Claude Code CLI reference: https://code.claude.com/docs/en/cli-usage (MEDIUM confidence for Claude print mode, JSON output, max turns, resume, and model selection; externally checked 2026-06-08).
- OpenAI Docs MCP page: https://developers.openai.com/learn/docs-mcp (MEDIUM confidence for Codex MCP configuration concept; externally checked 2026-06-08).

---
*Feature research for: claude-for-codex v1 team rollout*
*Researched: 2026-06-08*
