# Architecture Research

**Domain:** Local Node.js MCP plugin bridging Codex to Claude Code
**Researched:** 2026-06-08
**Confidence:** HIGH for current codebase shape, MEDIUM-HIGH for v1 target architecture

## Standard Architecture

### Current Architecture

The current `dev` branch is a single-file Node ESM MCP server. `server.mjs`
contains the MCP transport, tool registration, prompt construction, Claude CLI
argument construction, process spawning, job persistence, latest-session
persistence, in-memory child-process handles, result formatting, cancellation,
and setup checks.

```
┌─────────────────────────────────────────────────────────────┐
│                      Codex Runtime                           │
│       Codex CLI / App launches local MCP over stdio          │
└──────────────────────────────┬──────────────────────────────┘
                               │ stdio MCP
┌──────────────────────────────▼──────────────────────────────┐
│                      server.mjs                              │
│  MCP tools + prompts + runner + job store + sessions         │
│  + formatting + cancellation                                 │
└───────────────┬──────────────────────────────┬──────────────┘
                │                              │
                │ spawn claude -p              │ JSON files
┌───────────────▼──────────────┐      ┌────────▼──────────────┐
│       Claude Code CLI         │      │ Repo-scoped job store │
│ claude -p --output-format json│      │ ~/.claude-for-codex/  │
└───────────────────────────────┘      └───────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Optional, separate hook path                                 │
│ hooks/review-gate.mjs reads Codex Stop event stdin, invokes  │
│ Claude directly, and exits 2 to block or 0 to allow.          │
└─────────────────────────────────────────────────────────────┘
```

This architecture is enough for a prototype, but it makes reliable behavior hard
to test because every interesting behavior is coupled to the real MCP server,
real filesystem paths, and the real `claude` process boundary.

### Target V1 Architecture

V1 should remain a local single-process MCP plugin. Do not introduce a daemon,
database, hosted queue, worker service, or broad framework. The right move is a
small modular core under the same npm package, with dependency injection for
filesystem and process execution where tests need it.

```
┌─────────────────────────────────────────────────────────────┐
│                      Codex Runtime                           │
│  MCP config starts package binary over stdio                  │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ MCP Adapter                                                   │
│ - server construction                                         │
│ - zod input schemas                                           │
│ - tool response shaping                                       │
└──────────────┬──────────────────────┬───────────────────────┘
               │                      │
┌──────────────▼────────────┐ ┌───────▼───────────────────────┐
│ Prompt Builder             │ │ Session / Follow-up Service    │
│ - review prompts           │ │ - latest Claude session         │
│ - adversarial prompts      │ │ - explicit follow-up contract   │
│ - rescue/follow-up prompts │ │ - resume/fresh resolution       │
└──────────────┬────────────┘ └───────┬───────────────────────┘
               │                      │
┌──────────────▼──────────────────────▼───────────────────────┐
│ Job Orchestrator                                              │
│ - create foreground/background jobs                           │
│ - update status transitions                                   │
│ - format status/result/cancel semantics                       │
│ - detect stale running records                                │
└──────────────┬──────────────────────┬───────────────────────┘
               │                      │
┌──────────────▼────────────┐ ┌───────▼───────────────────────┐
│ Claude Runner              │ │ Job Store                      │
│ - build CLI args           │ │ - repo key and paths            │
│ - spawn claude -p          │ │ - job JSON CRUD                 │
│ - timeout/kill             │ │ - latest-session persistence    │
│ - parse Claude JSON/text   │ │ - stale-job marking             │
└──────────────┬────────────┘ └───────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────────┐
│ Claude Code CLI                                               │
│ Process boundary: claude -p --output-format json              │
└──────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ hooks/review-gate.mjs                                        │
│ Separate opt-in Codex Stop hook. It may share small prompt    │
│ text/constants later, but must not depend on a running MCP     │
│ server or durable job queue.                                  │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Recommended Implementation |
|-----------|----------------|----------------------------|
| MCP adapter | Own MCP server construction, tool names, zod schemas, and conversion from service results to MCP text responses. | Keep as the package binary entrypoint, initially `server.mjs` or `src/server.mjs`. Handlers should call core functions and avoid filesystem/process logic. |
| Prompt builder | Build review, adversarial review, rescue, and follow-up prompts from explicit inputs. | Pure functions returning strings. Snapshot/golden tests are cheap and valuable because prompt drift changes product behavior. |
| Claude runner | Own Claude CLI argument construction, process spawning, timeout/kill behavior, stdout/stderr capture, and JSON/text result parsing. | Injectable `spawn`/`spawnSync` wrapper. Default boundary is `claude -p --output-format json`; read-only arguments stay centralized here. |
| Job store | Own repo-scoped paths, job JSON read/write/list, status transition persistence, and latest-session file. | File-backed store with tempdir tests. Keep schema small and version-compatible. |
| Job orchestrator | Coordinate job lifecycle across prompt, runner, store, background behavior, formatting, and cancellation. | Service module that accepts `runner`, `store`, `clock`, and `idGenerator` dependencies in tests. |
| Session/follow-up | Make session continuation explicit: resolve latest session, specific session id, fresh start, and future `claude_followup` semantics. | Small service over job store/session file. Avoid hiding conversational follow-up inside `claude_rescue`. |
| Hook | Optional Codex Stop integration that blocks only on explicit `BLOCK:` verdict. | Keep in `hooks/`. It should be installable/removable independently and should not be part of default v1 onboarding. |

## Recommended Project Structure

Prefer a staged extraction that works with the current ESM JavaScript package.
Do not start v1 by adding a TypeScript build unless the team explicitly accepts
the packaging and CI cost. The MCP TypeScript SDK can be used from the current
Node ESM runtime, and the current package already publishes `server.mjs`.

```
.
├── server.mjs                  # package binary; thin MCP adapter
├── src/
│   ├── mcp/
│   │   └── tools.mjs           # tool schemas and handler wiring
│   ├── prompts/
│   │   └── review-prompts.mjs  # pure prompt builders
│   ├── claude/
│   │   ├── runner.mjs          # CLI args, spawn, timeout, parse output
│   │   └── permissions.mjs     # read-only/write tool policy constants
│   ├── jobs/
│   │   ├── store.mjs           # repo-scoped file-backed job/session store
│   │   ├── orchestrator.mjs    # foreground/background lifecycle
│   │   └── format.mjs          # status/result user-facing formatting
│   └── sessions/
│       └── followup.mjs        # resume/fresh/latest-session rules
├── hooks/
│   └── review-gate.mjs         # opt-in hook, separate process path
└── test/
    ├── job-store.test.mjs
    ├── runner.test.mjs
    ├── prompts.test.mjs
    └── tool-contract.test.mjs
```

### Structure Rationale

- **`server.mjs`:** Preserve the published binary path and minimize packaging
  churn. It becomes the composition root instead of the monolith.
- **`src/mcp/`:** MCP is an adapter, not the domain. Keeping schemas and handler
  wiring here prevents MCP response details from leaking into the job store.
- **`src/prompts/`:** Prompt behavior is product behavior. Pure functions make
  review/follow-up wording testable without launching Claude.
- **`src/claude/`:** Claude CLI is the external process boundary. Centralizing
  args and parse behavior prevents safety flags from drifting between tools.
- **`src/jobs/`:** Job lifecycle is the reliability core. Store and orchestrator
  should be independently testable with fake clocks, ids, and runners.
- **`src/sessions/`:** Session continuation needs its own contract so follow-up
  does not become an implicit `rescue` side effect.
- **`hooks/`:** Hooks are lifecycle automation. Keep them separate and opt-in so
  the team can use manual slash/MCP workflows without surprise usage loops.

## Architectural Patterns

### Pattern 1: Thin Adapter, Testable Core

**What:** MCP handlers validate inputs, call core services, and format MCP
responses. They do not build prompts, spawn processes, or mutate job files
directly.

**When to use:** Immediately. This is the main refactor that makes v1 reliable
without changing the product surface.

**Trade-offs:** Adds a few small files, but removes the current all-or-nothing
test surface in `server.mjs`.

```javascript
// MCP adapter shape, not final code.
server.registerTool("claude_review", schema, async (input) => {
  const result = await jobs.startReview(input);
  return toMcpText(result);
});
```

### Pattern 2: File-Backed Job Store With Explicit Transitions

**What:** Store operations are small and boring: create running job, read job,
list recent jobs, update terminal state, remember latest session, and mark stale
running records.

**When to use:** V1 should keep the file-backed store. It matches the local-only
plugin model and avoids overbuilding a durable queue.

**Trade-offs:** Cancellation remains best-effort across MCP process restarts.
That is acceptable if the user contract says cancellation is process-aware and
stale running jobs are detected/marked clearly.

```javascript
// Store contract shape.
store.create(job);
store.update(job.id, { status: "done", endedAt, result, sessionId });
store.listRecent({ limit: 10 });
store.rememberSession(sessionId);
```

### Pattern 3: Injectable Runner Boundary

**What:** The runner receives a prompt and execution options, builds Claude CLI
args, runs `claude -p`, and returns a normalized result object. Tests pass a fake
runner or fake spawn implementation.

**When to use:** Before changing background, timeout, parse, or failure behavior.

**Trade-offs:** This abstraction is worth it because Claude Code auth, billing,
and model availability are outside CI. Do not wrap it in a plugin framework or
job worker abstraction.

```javascript
// Runner result shape.
{
  exitCode: 0,
  status: "done",
  result: "review text",
  sessionId: "claude-session-id",
  costUsd: 0.0123,
  numTurns: 4
}
```

### Pattern 4: Explicit Session Continuation

**What:** Treat session continuation as a first-class behavior. `resume: true`
means "use latest Claude session for this repo"; a string means "use this exact
session"; `fresh: true` suppresses resume. A future `claude_followup` tool should
use the same resolver.

**When to use:** Before documenting follow-up workflows or adding a follow-up
tool.

**Trade-offs:** Adds a small service, but prevents users from treating
`claude_rescue` as the only conversational follow-up path.

## Data Flow

### Foreground Review Flow

```
Codex user invokes claude_review
    ↓
MCP adapter validates { base, background, cwd }
    ↓
Prompt builder creates grounded read-only review prompt
    ↓
Job orchestrator creates running job in job store
    ↓
Claude runner spawns:
  claude -p <prompt> --output-format json --model <model>
    ↓
Runner parses JSON or text fallback
    ↓
Job orchestrator writes done/error job and latest session id
    ↓
MCP adapter returns formatted result text
```

### Background Job Flow

```
Tool call with background=true
    ↓
Job orchestrator creates task id and running job
    ↓
Claude runner starts child process
    ↓
MCP adapter returns task id immediately
    ↓
Child close/error callback normalizes result
    ↓
Job store updates terminal state
    ↓
claude_status / claude_result reads job store later
```

### Cancellation Flow

```
claude_cancel
    ↓
MCP adapter resolves requested or latest running job
    ↓
Job orchestrator checks live process map and persisted pid
    ↓
Best-effort SIGKILL
    ↓
Job store writes cancelled terminal state
```

V1 should also detect stale `running` jobs when no live process exists or when
the pid is gone. Report them as stale/abandoned instead of implying a durable
queue survived the MCP process restart.

### Follow-Up Flow

```
claude_followup or claude_rescue resume:true
    ↓
Session service resolves repo-scoped latest session id
    ↓
Prompt builder creates follow-up/rescue prompt
    ↓
Claude runner adds --resume <session-id>
    ↓
Job result stores any returned replacement/new session id
```

### Hook Flow

```
Codex Stop event
    ↓
hooks/review-gate.mjs reads stdin JSON and cwd
    ↓
Hook invokes Claude directly with a short read-only gate prompt
    ↓
Claude returns JSON/text verdict
    ↓
Verdict starts BLOCK:  → hook writes stderr and exits 2
Other verdict          → hook exits 0
```

The hook should stay separate from the MCP job flow. It is not a background job,
not a session continuation feature, and not part of default onboarding.

## Build Order Implications

1. **Lock current behavior with narrow tests.** Add tests around job JSON
   schema, status formatting, prompt text basics, and runner parse behavior
   using fake Claude output. This prevents the extraction from changing user
   contracts accidentally.
2. **Extract job store first.** This is the highest-leverage module because
   status/result/cancel/session behavior all depend on it. If the parallel
   state-store PR lands first, use it as the base rather than creating a second
   store.
3. **Extract runner second.** Centralize read-only permissions,
   `--dangerously-skip-permissions`, timeouts, JSON parsing, stderr fallback,
   and launch/auth failure messages.
4. **Extract prompt builder third.** Keep review/adversarial/rescue prompt
   wording in pure functions and snapshot only durable invariants, not every
   incidental phrase.
5. **Make MCP adapter thin.** Once store, runner, and prompts exist, tool
   handlers should be orchestration glue only.
6. **Clarify session/follow-up semantics.** Add a small resolver and then add
   any `claude_followup` tool. Do not overload `claude_rescue` further.
7. **Improve stale-running and context-limit failures.** After the core is
   testable, add diagnostics for abandoned jobs, Claude launch/auth failures,
   timeout kills, and large-diff guidance.
8. **Keep hook improvements last and opt-in.** Hook UX should not block manual
   v1 review quality. If sharing constants, share only stable prompt/safety
   snippets; do not make the hook depend on the MCP server lifecycle.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| One developer / one repo | Current file-backed store is sufficient after extraction. Use tempdir tests and fake runner tests. |
| Small team across repos | Keep repo-scoped store keys, document store path, detect stale jobs, and keep package `files` updated for new runtime modules. |
| Heavy local usage | Add retention/cleanup for old job files and better large-diff warnings. Avoid a daemon until users actually need cross-process queue semantics. |
| Public plugin audience | Consider TypeScript migration, stricter schema versioning, migration helpers for old jobs, and richer setup diagnostics. Still avoid a hosted service. |

### Scaling Priorities

1. **First bottleneck: reliability of job/session state.** Fix with extracted
   job store tests, explicit status transitions, and stale-running detection.
2. **Second bottleneck: process boundary failures.** Fix with runner tests,
   structured launch/auth/timeout errors, and clearer result formatting.
3. **Third bottleneck: prompt/context quality.** Fix with prompt builder tests
   and precomputed repo status/diff summaries only after manual review workflow
   is stable.

## Anti-Patterns

### Anti-Pattern 1: Growing `server.mjs` Further

**What people do:** Add `claude_followup`, stale-job cleanup, context-limit
handling, and hook sharing directly into the monolithic server.

**Why it is wrong:** Every behavior remains hard to test without real MCP and
real Claude. State semantics will drift between tools.

**Do this instead:** Extract job store and runner first, then add features
through those boundaries.

### Anti-Pattern 2: Building a Durable Queue Too Early

**What people do:** Add a daemon, SQLite database, worker process, or remote
queue to solve cancellation and background jobs.

**Why it is wrong:** The product is a local-first MCP plugin. Most v1 failures
come from untested state transitions and process handling, not lack of a queue.

**Do this instead:** Keep JSON job files, document best-effort cancellation, and
mark stale running jobs honestly.

### Anti-Pattern 3: Coupling Hooks to MCP Server State

**What people do:** Make the Stop hook call MCP tools or depend on the MCP
server's in-memory live process map.

**Why it is wrong:** Hooks run as lifecycle automation and should be easy to
install/remove. Coupling them to MCP state creates config drift and failure
modes in the default review path.

**Do this instead:** Keep the hook a separate script. Share only stable prompt
or permission constants if duplication becomes a real maintenance problem.

### Anti-Pattern 4: Hiding Follow-Up Inside Rescue

**What people do:** Tell users to use `claude_rescue resume:true` for every
follow-up question.

**Why it is wrong:** Rescue implies delegation and possible fix work. Follow-up
is conversational review continuity and should be safer and clearer.

**Do this instead:** Add explicit session resolution and a future
`claude_followup` tool with read-only defaults.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Codex MCP integration | Local stdio MCP server launched from Codex config. | Official OpenAI docs validate the stdio/local MCP direction for Codex. Keep adapter small and config-driven. |
| MCP SDK | Node package `@modelcontextprotocol/sdk` with MCP server and stdio transport. | Official MCP SDK docs list TypeScript SDK as Tier 1. Current ESM JavaScript can continue using the SDK without a TypeScript migration. |
| Claude Code CLI | Spawn `claude -p --output-format json` with model, max turns, permissions, and optional `--resume`. | This is the hard process boundary. Keep flags centralized in the runner and keep write mode explicitly guarded. |
| Local git repo | Claude reads repo state through allowed tools such as `Read`, `Grep`, `Glob`, and read-style `git` commands. | V1 should pass explicit review instructions and later may precompute concise status/diff summaries. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| MCP adapter ↔ job orchestrator | Direct function calls with normalized input objects. | Adapter should not know file paths or child process details. |
| Job orchestrator ↔ job store | Store interface methods. | Enables tempdir tests and future schema migration without MCP changes. |
| Job orchestrator ↔ Claude runner | Runner interface returning normalized execution result. | Enables fake Claude tests and consistent timeout/error behavior. |
| Prompt builder ↔ orchestrator | Pure strings from explicit inputs. | Avoid claiming Claude sees Codex chat context; pass concrete artifacts and focus. |
| Session service ↔ job store | Read/write latest session id and resolve resume mode. | Keeps follow-up semantics separate from rescue semantics. |
| Hook ↔ shared core | Prefer no dependency for v1; optional shared constants only. | Hook must remain opt-in, reversible, and independent from MCP process state. |

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| Current architecture | HIGH | Verified from `server.mjs`, `hooks/review-gate.mjs`, package metadata, and existing codebase maps. |
| MCP/stdin local integration | HIGH | Current code uses MCP stdio transport; official MCP and OpenAI docs support this direction. |
| Claude CLI boundary | HIGH | Current code and Anthropic CLI docs align on `claude -p` print-mode process invocation and flags. |
| Recommended module boundaries | MEDIUM-HIGH | Boundaries map directly to current responsibilities and active project concerns; exact filenames may shift during implementation. |
| Hook separation | HIGH | Current hook is already separate, and project docs identify hook-first onboarding as out of scope. |
| Follow-up/session path | MEDIUM | Latest-session persistence exists, but `claude_followup` is not implemented yet, so v1 contract still needs design validation. |

## Sources

- Model Context Protocol SDK page: https://modelcontextprotocol.io/docs/sdk
- Anthropic Claude Code CLI reference: https://code.claude.com/docs/en/cli-usage
- OpenAI Docs MCP page: https://developers.openai.com/learn/docs-mcp
- Local source: `server.mjs`
- Local source: `hooks/review-gate.mjs`
- Local source: `docs/DESIGN.md`
- Local source: `.planning/codebase/ARCHITECTURE.md`
- Local source: `.planning/codebase/CONCERNS.md`

---
*Architecture research for: claude-for-codex*
*Researched: 2026-06-08*
