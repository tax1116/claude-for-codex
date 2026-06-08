# Pitfalls Research

**Domain:** Brownfield local MCP plugin: Codex calls Claude Code for manual design critique and implementation-risk review
**Researched:** 2026-06-08
**Confidence:** HIGH for repo-specific risks; MEDIUM for external CLI/config behavior because those surfaces can change

## Critical Pitfalls

### Pitfall 1: Hook Review Loops Burn Usage And Block Completion

**Severity:** Critical
**Confidence:** HIGH

**What goes wrong:**
The optional Codex `Stop` hook repeatedly calls Claude when Codex tries to finish, then exits `2` on `BLOCK:` output. A noisy or flaky verdict can trap the user in a Codex-to-Claude repair loop, consume usage quickly, and make normal Codex turns feel unreliable.

**Why it happens:**
Hook automation runs at a lifecycle boundary that users experience as "done." The hook implementation is separate from `server.mjs`, calls Claude directly, and treats a single-line `BLOCK:` response as a hard stop. The reference reverse plugin also warns that review gates can create long-running loops, so this is a known workflow-class risk rather than only a local implementation detail.

**How to avoid:**
Keep hooks opt-in and outside default onboarding. Make the manual slash/MCP path the v1 default. For hook setup, require explicit enable/disable/status commands, keep the hook shallow, cap turns and timeout, return short actionable blocking reasons, and document a one-step disable path next to every enable path.

**Warning signs:**
Users ask why Codex "will not finish"; repeated Claude review output appears after every final response; hook docs appear before manual review docs; the hook grows into a deep review path; CI lacks hook exit-code tests for `OK`, `BLOCK:`, malformed JSON, launch failure, and timeout.

**Phase to address:**
Phase 1: Core manual review first. Phase 3: Hook setup/status only after core review, follow-up, and cancellation semantics are testable.

---

### Pitfall 2: Write Permission Bypass Becomes A Casual Rescue Option

**Severity:** Critical
**Confidence:** HIGH

**What goes wrong:**
`claude_rescue allow_write:true` invokes Claude Code with `--dangerously-skip-permissions`, allowing Claude to edit files without the plugin's default read-only boundary. A user can accidentally turn a second-opinion tool into an unsupervised writer in a sensitive repo.

**Why it happens:**
The code path is one boolean away from bypass mode. The README and setup docs warn about it, but the MCP tool description also advertises the flag. If v1 emphasizes "rescue" too strongly, users may treat write-enabled Claude as normal delegation rather than an exceptional trust boundary.

**How to avoid:**
Keep all review and follow-up tools read-only. Keep `allow_write` default false, exclude it from standard team prompts, and place warning language next to every mention. Prefer `--allowedTools`/`--disallowedTools` for review paths. If write rescue remains, add an environment guard or explicit confirmation token before passing the bypass flag.

**Warning signs:**
Slash commands expose write rescue as a common path; examples include `allow_write:true`; tests assert only that rescue runs, not which permission flags are passed; docs describe rescue as "fix this" without a read-only default reminder.

**Phase to address:**
Phase 1: Lock review/follow-up read-only command construction with fake-Claude tests. Phase 2: Add guarded rescue semantics only after the runner is injectable and testable.

---

### Pitfall 3: Token And Context Exhaustion Is Treated As A Claude Problem

**Severity:** Critical
**Confidence:** HIGH

**What goes wrong:**
Large diffs, many untracked files, or broad "review everything" prompts can hit practical context, turn, timeout, or budget limits. Users receive late failures or partial reviews without guidance on narrowing `base`, `focus`, or scope.

**Why it happens:**
The server forwards broad prompts to `claude -p --output-format json` and relies on Claude Code behavior. The current code sets `--max-turns`, but it does not preflight diff size, file count, output size, budget, or likely timeout. Claude Code exposes budget, turn-limit, JSON output, and resume controls, but v1 must decide how this plugin uses and explains them.

**How to avoid:**
Preflight `git status`, tracked diff size, and untracked file count before launching Claude. Warn or refuse with a narrowing suggestion when the review is too broad. Keep `base` and `focus` prominent. On context/turn/timeout errors, return a structured next action: split the diff, choose a base ref, run adversarial review with focus, or use background mode.

**Warning signs:**
Reviews fail with raw stdout/stderr; `claude_result` shows `(no output, exit X)` for large changes; users rerun the same broad review; docs promise "multi-file review" without recommending background and scope controls.

**Phase to address:**
Phase 1: Add failure classification and large-diff warnings. Phase 2: Add focused review ergonomics and result summaries that explain incomplete coverage.

---

### Pitfall 4: Stale Background Jobs Look Running Forever

**Severity:** Critical
**Confidence:** HIGH

**What goes wrong:**
A background job record stays `running` after the MCP server restarts, Claude exits outside the current process, or the child process handle is lost. `claude_cancel` may report cancellation after updating JSON while the real work is already gone, or may fail to stop work that no longer has a live handle.

**Why it happens:**
Job JSON persists under a repo-scoped store, but the `live` child-process map is in memory. The current job record includes `pid`, but there is no stale detection, process identity verification, heartbeat, or abandoned-state transition.

**How to avoid:**
Extract a job-store module first. Store enough metadata for stale detection, mark abandoned jobs explicitly after restart or missing PID, and distinguish "cancelled by this server" from "marked abandoned." Avoid promising durable queue semantics unless the implementation can prove them.

**Warning signs:**
`claude_status` lists old `running` jobs; `claude_result` defaults to stale records; cancellation behavior differs before and after MCP restart; tests do not simulate restart with persisted running job JSON.

**Phase to address:**
Phase 1: Job-store extraction and deterministic stale-job tests. Phase 2: UX polish for status/result/cancel wording.

---

### Pitfall 5: Fake Context Sharing Overpromises What Claude Sees

**Severity:** Critical
**Confidence:** HIGH

**What goes wrong:**
Docs or prompts imply that Claude receives the full Codex chat, plan, reasoning, or hidden context. Claude then reviews only repo state and explicit prompt artifacts, causing missed assumptions and user distrust when the "second opinion" lacks necessary context.

**Why it happens:**
The product value is "Codex asks Claude," which is easy to phrase as shared context. In reality, v1 passes a prompt and lets Claude inspect files and git state through allowed tools. Session resume continues Claude's own session, not Codex's conversation.

**How to avoid:**
State the contract plainly: Claude sees only the prompt, cwd, allowed repo reads, git state, prior stored Claude output when provided, and any explicit `focus`/review text. Build follow-up as a fresh call over stored review output or selected artifacts, not as invisible Codex-chat transfer. Document session resume as Claude-session continuity only.

**Warning signs:**
Phrases like "Claude continues your Codex conversation"; follow-up depends only on `--resume`; review prompts omit planning docs or user focus; user reports "Claude ignored what we discussed."

**Phase to address:**
Phase 1: Docs and prompt contract. Phase 2: Implement explicit follow-up context selection.

---

### Pitfall 6: Live Claude Code Dependency Is Hidden Until Runtime

**Severity:** Critical
**Confidence:** HIGH

**What goes wrong:**
The MCP server starts, tools register, but every meaningful action fails because Claude Code is missing, not authenticated, unavailable in PATH, or configured differently from the docs. Users diagnose this as a plugin failure.

**Why it happens:**
This plugin is local-first and shells out to `CLAUDE_BIN` for every review/rescue run. `claude_setup` checks `--version`, but actual auth and non-interactive `-p` behavior can fail later. CI must not depend on a real Claude account, so automated coverage can accidentally skip the highest-friction user setup path.

**How to avoid:**
Make setup/status a first-class v1 path: check binary, version, auth readiness where possible, configured model, store path, MCP config hints, and hook state. Return installation/auth next steps with each launch failure. Use fake-Claude tests for runner behavior and keep real-Claude smoke checks manual.

**Warning signs:**
Users first discover missing auth from `claude_review`; setup docs stop at install; CI tries to call real `claude`; launch errors expose raw stack traces or raw `spawn` errors without next steps.

**Phase to address:**
Phase 1: Injectable runner and fake-Claude tests. Phase 2: Setup/status diagnostics.

---

## Moderate Pitfalls

### Pitfall 7: Package `files` Array Omits New Runtime Code

**Severity:** High
**Confidence:** HIGH

**What goes wrong:**
New modules, setup scripts, prompt files, or docs work locally but are missing from the npm artifact because `package.json` publishes only an explicit `files` allowlist.

**Why it happens:**
Brownfield refactors will likely extract `server.mjs` into runtime modules. Local tests import those files from the repo, while published users install the packed artifact.

**How to avoid:**
Update `files` with every new runtime directory and keep `npm run pack:check` mandatory. For package/publishing changes, inspect dry-run output, not just command success.

**Warning signs:**
New `src/`, `lib/`, `bin/`, or `setup/` directories appear without `package.json` changes; CI passes syntax/lint but no package-content assertion exists; README install examples reference files outside the allowlist.

**Phase to address:**
Every phase that adds files. Make pack verification part of the phase exit criteria.

---

### Pitfall 8: Tests Accidentally Require Real Claude, Codex, Or Network

**Severity:** High
**Confidence:** HIGH

**What goes wrong:**
Behavior tests become flaky, expensive, credential-dependent, or impossible in CI because they invoke real Claude Code, require a logged-in user, or depend on live Codex/MCP configuration.

**Why it happens:**
The current code spawns `claude` directly from tool handlers. Without an injectable runner and temporary store, the easiest test is a real smoke test. Current CI only proves lint, syntax, and package dry-run.

**How to avoid:**
Extract runner and job-store boundaries before feature expansion. Use `node:test`, temporary directories, and fake Claude binaries/scripts that emit JSON, malformed JSON, delays, errors, and session IDs. Keep real-Claude checks documented as manual smoke tests only.

**Warning signs:**
CI secrets are requested for Claude; tests skip when `claude` is unavailable; background/cancel tests sleep for real model time; no fixtures cover malformed JSON, timeout, or launch failure.

**Phase to address:**
Phase 1: Core extraction and fake runner. Phase 2+: Add contract tests for each new tool before docs claim it.

---

### Pitfall 9: Hook And MCP Config Drift Apart

**Severity:** High
**Confidence:** HIGH

**What goes wrong:**
The MCP tools and `hooks/review-gate.mjs` use different allowed tools, model selection, timeouts, prompts, state roots, or setup assumptions. A user updates one path but the other keeps old behavior.

**Why it happens:**
The hook is intentionally standalone and does not reuse `server.mjs`. That independence is good for lifecycle isolation, but duplicated constants and prompt policy drift unless managed deliberately.

**How to avoid:**
Either keep the hook very small and explicitly duplicated, or extract shared constants after the core modules exist. Do not couple hook execution to the long-running MCP server. Add hook-specific tests and docs that distinguish MCP installed from hook enabled.

**Warning signs:**
`CLAUDE_MODEL` behaves differently in hook and MCP tools; docs change allowed commands in one place; hook can edit or read more than review tools; hook setup writes a different state root from status.

**Phase to address:**
Phase 3: Hook setup/status and shared policy review.

---

### Pitfall 10: Billing And Docs Staleness Mislead Users

**Severity:** High
**Confidence:** MEDIUM

**What goes wrong:**
README or setup docs make stale claims about Claude Code billing, Codex MCP config, hook behavior, model aliases, or CLI flags. Users make cost or setup decisions based on outdated mid-2026 notes.

**Why it happens:**
Both Claude Code CLI and Codex MCP/hook surfaces are external, actively changing tools. The repo currently includes time-sensitive billing notes and tells users to verify installed-version behavior.

**How to avoid:**
Phrase billing as advisory, link to official Claude Code docs, and add a release checklist item to re-check CLI flags, permission flags, MCP config, hooks, and billing language. Avoid hard promises about cost, default model aliases, or hook stability.

**Warning signs:**
Docs say "as of mid-2026" without a re-check date; setup snippets diverge from OpenAI MCP documentation; model aliases or permission flags are described as permanent; release notes do not mention external-doc verification.

**Phase to address:**
Every release phase, especially before npm publishing or team rollout.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Severity | Confidence | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|----------|------------|-------------------|----------------|-----------------|
| Keep all server logic in `server.mjs` | High | HIGH | Fast prototype edits | Prompt, job, runner, and tool behavior remain hard to test | Only before Phase 1 begins |
| Add features before extracting job store and runner | Critical | HIGH | Visible tool growth | Stale jobs, cancellation, and permission behavior regress silently | Never for v1 |
| Use Claude session resume as generic follow-up | High | HIGH | Simple continuation UX | Conflates Claude session context with explicit review context | Only for rescue, clearly labeled |
| Treat hook setup snippets as setup automation | High | HIGH | Avoids config editing code | Users cannot reliably inspect or disable plugin-owned hook state | MVP docs only, not v1 team rollout |
| Rely on prompt compliance for untracked files | Medium | HIGH | No server-side git parsing | Claude can miss generated/new files | Acceptable in prototype; compute structured status later |

## Integration Gotchas

Common mistakes when connecting to external services and local tools.

| Integration | Common Mistake | Severity | Confidence | Correct Approach |
|-------------|----------------|----------|------------|------------------|
| Claude Code CLI | Assuming `claude --version` proves authenticated `claude -p` runs | High | HIGH | Setup/status should test or clearly diagnose non-interactive auth failures |
| Claude Code CLI | Passing broad prompts without budget, turn, timeout, or scope strategy | Critical | HIGH | Use max turns, timeout, preflight size checks, and focused retry guidance |
| Claude Code CLI permissions | Treating `--dangerously-skip-permissions` as normal delegation | Critical | HIGH | Default to allowed read tools; gate write bypass explicitly |
| Codex MCP config | Publishing config snippets without absolute-path and timeout guidance | High | HIGH | Document exact MCP setup, timeout rationale, and restart requirement |
| Codex hooks | Enabling `Stop` hook as part of default install | Critical | HIGH | Keep hook opt-in with status and disable path |
| npm package | Forgetting explicit `files` allowlist | High | HIGH | Pair new runtime paths with `files` updates and pack dry-run inspection |

## Performance Traps

Patterns that work in tiny demos but fail during normal team use.

| Trap | Symptoms | Severity | Confidence | Prevention | When It Breaks |
|------|----------|----------|------------|------------|----------------|
| Foreground review for multi-file diffs | MCP tool timeouts, Codex appears blocked | High | HIGH | Recommend `background:true` for multi-file review and keep status/result reliable | Medium PRs or slow local Claude runs |
| Unlimited repo-context prompts | Context failures, partial findings, high cost | Critical | HIGH | Preflight diff/file scope and require `base`/`focus` for broad changes | Large diffs, generated files, monorepos |
| Persist full job list forever | Slow status, noisy result selection | Medium | MEDIUM | Prune summaries and keep full output per job | Long-lived team repos |
| Deep hook reviews | Slow every-turn completion and loops | Critical | HIGH | Hook should be shallow and short; deep review stays manual/background | Any active hook user |

## Security Mistakes

Domain-specific security issues beyond general package security.

| Mistake | Risk | Severity | Confidence | Prevention |
|---------|------|----------|------------|------------|
| Write-enabled Claude bypass in trusted-looking repos | Unauthorized edits, data loss, secret exposure through tool use | Critical | HIGH | Keep write disabled by default; add explicit guard and warnings |
| Overbroad Bash allowlist | Claude can run commands outside review intent | Critical | HIGH | Keep read-only git command allowlist tight; test command construction |
| Hook edits user config without managed block/backup | Breaks Codex setup or disables unrelated hooks | High | MEDIUM | If setup automation edits config, use plugin-owned block and backup |
| Storing job outputs without data guidance | Sensitive review output persists under user home | Medium | MEDIUM | Document local storage path and cleanup; avoid cloud sync assumptions |
| Claiming official affiliation | User trust and legal risk | High | HIGH | Keep "unofficial" language in README, package metadata, and docs |

## UX Pitfalls

Common user experience mistakes for this plugin.

| Pitfall | User Impact | Severity | Confidence | Better Approach |
|---------|-------------|----------|------------|-----------------|
| Hook-first onboarding | Users encounter automation before understanding manual review | Critical | HIGH | Lead with `/claude-review` and MCP tools; hooks second |
| Ambiguous status values | Scripts/docs disagree on `done` vs `completed` | Medium | HIGH | Decide contract early or provide compatibility formatting |
| Vague launch failures | Users cannot distinguish missing binary, auth, model, timeout, or JSON parse failure | High | HIGH | Return classified error messages with next action |
| Follow-up semantics are implicit | Users misuse rescue resume for review questions | High | HIGH | Add `claude_followup` with explicit context source |
| Result defaults choose surprising jobs | User sees an old completed job instead of current running/failing one | Medium | MEDIUM | Make latest-job selection explicit and show status context |

## "Looks Done But Isn't" Checklist

- [ ] **Manual review workflow:** Works read-only with fake Claude and real repo diffs; verify allowed/disallowed tool flags.
- [ ] **Adversarial review:** Accepts `focus` and base ref; verify prompt includes scope and untracked-file instructions.
- [ ] **Follow-up:** Uses stored review output or explicit text; verify it does not pretend to share Codex chat context.
- [ ] **Background jobs:** Persist, list, return results, classify errors, and mark stale jobs after restart.
- [ ] **Cancellation:** Cancels live child processes and reports abandoned/stale jobs truthfully after process restart.
- [ ] **Hook:** `OK`, `BLOCK:`, malformed JSON, timeout, and launch failure behavior are tested.
- [ ] **Write rescue:** Default is read-only; verify write bypass requires explicit opt-in and warning.
- [ ] **Packaging:** `npm run pack:check` includes every runtime file, prompt, and setup doc.
- [ ] **Docs:** Billing, CLI flags, MCP config, and hook language have a release-date re-check.
- [ ] **Real Claude smoke:** Documented manual smoke exists, but CI does not require a live Claude account.

## Recovery Strategies

When pitfalls occur despite prevention, recover without widening the blast radius.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Hook loop | MEDIUM | Disable the plugin hook, inspect recent Claude verdicts, add hook fixture for the false-positive case, keep manual review path active |
| Permission bypass misuse | HIGH | Stop Claude job, inspect git diff/status, revert only confirmed unwanted edits, add guard/test before re-enabling write rescue |
| Context exhaustion | LOW | Re-run with narrower `base`/`focus`, split review by subsystem, add preflight warning case |
| Stale running job | MEDIUM | Mark job abandoned, verify PID state, add restart fixture, avoid deleting job output until user can inspect it |
| Missing package files | HIGH | Fix `files`, run pack dry-run, install packed tarball locally, publish patch if already released |
| Real-Claude test dependency | MEDIUM | Replace with fake runner, move live check to manual smoke docs, remove credentials from CI |
| Docs staleness | LOW | Re-check official docs, update dated claims, add release checklist item |

## Pitfall-to-Phase Mapping

How roadmap phases should prevent these mistakes.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Hook loops | Phase 3: Hook opt-in automation | Hook remains disabled by default; fixture tests cover `OK`, `BLOCK:`, malformed JSON, timeout, launch failure |
| Write permission bypass | Phase 1: Read-only core; Phase 2: Rescue guard | Fake runner asserts review/follow-up never pass bypass; rescue requires explicit guard |
| Token/context exhaustion | Phase 1: Failure classification; Phase 2: Scope UX | Large-diff fixture returns narrowing guidance; docs show `base`, `focus`, and background examples |
| Stale background jobs | Phase 1: Job-store extraction | Restart fixture marks old running job abandoned or stale |
| Fake context sharing | Phase 1: Prompt/docs contract; Phase 2: Follow-up | Docs state explicit context boundary; follow-up tests require selected context source |
| Live Claude dependency | Phase 1: Runner abstraction; Phase 2: Setup/status | CI uses fake Claude; setup/status smoke documents real Claude checks |
| Package files omission | Every phase that adds runtime files | `npm run pack:check` output inspected; packed tarball contains new runtime paths |
| Real-Claude tests | Phase 1: Test harness | CI passes without Claude installed or authenticated |
| Billing/docs staleness | Release phase | Release checklist includes official-doc re-check date and links |
| Hook/MCP config drift | Phase 3: Hook setup/status | Shared or intentionally duplicated policy is documented; hook-specific tests pass |

## Sources

- Repo planning and implementation files: `.planning/PROJECT.md`, `.planning/codebase/CONCERNS.md`, `.planning/codebase/TESTING.md`, `.planning/codebase/INTEGRATIONS.md`, `README.md`, `docs/SETUP.md`, `hooks/review-gate.mjs`, `server.mjs`, `package.json`.
- Anthropic Claude Code CLI reference: https://code.claude.com/docs/en/cli-usage
- OpenAI `codex-plugin-cc` README: https://github.com/openai/codex-plugin-cc/blob/main/README.md
- OpenAI Docs MCP page: https://developers.openai.com/learn/docs-mcp

---
*Pitfalls research for: claude-for-codex*
*Researched: 2026-06-08*
