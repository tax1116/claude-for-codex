#!/usr/bin/env node
/**
 * claude-for-codex — call Claude Code from OpenAI Codex CLI via MCP.
 * Unofficial conceptual counterpart to openai/codex-plugin-cc
 * (which goes Claude Code -> Codex).
 *
 * Tools:
 *   claude_setup              - check Claude Code install + auth
 *   claude_review             - read-only review of current/branch changes
 *   claude_adversarial_review - steerable challenge review (takes focus text)
 *   claude_rescue             - delegate a task to Claude (resume/fresh/model/write)
 *   claude_status             - list running/recent jobs for this repo
 *   claude_result             - final output of a finished job (+ Claude session id)
 *   claude_cancel             - cancel an active background job
 *
 * All long-running tools accept background=true and return a task id immediately.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { spawn, spawnSync } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const CLAUDE_BIN = process.env.CLAUDE_BIN || "claude";
const DEFAULT_MODEL = process.env.CLAUDE_MODEL || "sonnet";
const DEFAULT_TIMEOUT_MS = Number(process.env.CLAUDE_TIMEOUT_MS || 600_000);
const STORE_ROOT =
  process.env.CLAUDE_FOR_CODEX_STORE ||
  process.env.CODEX_CC_STORE ||
  path.join(os.homedir(), ".claude-for-codex", "jobs");

const READ_ONLY_ALLOW =
  "Read,Grep,Glob,Bash(git diff:*),Bash(git log:*),Bash(git status:*),Bash(git show:*)";
const WRITE_DISALLOW = "Edit,Write,MultiEdit,NotebookEdit";

// ---------- repo + job store helpers ----------

function repoRoot(cwd) {
  const r = spawnSync("git", ["rev-parse", "--show-toplevel"], { cwd: cwd || process.cwd() });
  if (r.status === 0) return r.stdout.toString().trim();
  return path.resolve(cwd || process.cwd());
}
function repoKey(cwd) {
  return createHash("sha1").update(repoRoot(cwd)).digest("hex").slice(0, 12);
}
function jobsDir(cwd) {
  const d = path.join(STORE_ROOT, repoKey(cwd));
  fs.mkdirSync(d, { recursive: true });
  return d;
}
function jobPath(cwd, id) {
  return path.join(jobsDir(cwd), `${id}.json`);
}
function writeJob(cwd, job) {
  fs.writeFileSync(jobPath(cwd, job.id), JSON.stringify(job, null, 2));
}
function readJob(cwd, id) {
  try {
    return JSON.parse(fs.readFileSync(jobPath(cwd, id), "utf8"));
  } catch {
    return null;
  }
}
function listJobs(cwd) {
  const d = jobsDir(cwd);
  return fs
    .readdirSync(d)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      try {
        return JSON.parse(fs.readFileSync(path.join(d, f), "utf8"));
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => (b.startedAt || 0) - (a.startedAt || 0));
}
function lastSessionFile(cwd) {
  return path.join(jobsDir(cwd), "last-session.txt");
}
function rememberSession(cwd, sid) {
  if (sid) fs.writeFileSync(lastSessionFile(cwd), sid);
}
function lastSession(cwd) {
  try {
    return fs.readFileSync(lastSessionFile(cwd), "utf8").trim() || null;
  } catch {
    return null;
  }
}

// in-memory handles for cancel within this server's lifetime
const live = new Map(); // id -> child

// ---------- claude invocation ----------

function buildArgs({ prompt, model, maxTurns, allowWrite, resume }) {
  const args = ["-p", prompt, "--output-format", "json", "--model", model, "--max-turns", String(maxTurns)];
  if (resume) args.push("--resume", resume);
  if (allowWrite) args.push("--dangerously-skip-permissions");
  else {
    args.push("--allowedTools", READ_ONLY_ALLOW);
    args.push("--disallowedTools", WRITE_DISALLOW);
  }
  return args;
}

function newId() {
  return "task-" + randomBytes(5).toString("hex");
}

// Start a claude run as a tracked job. Returns the job object.
// If background=false the returned promise resolves when finished (foreground).
function startJob({ kind, prompt, model, maxTurns, allowWrite, resume, cwd, background }) {
  const id = newId();
  const dir = cwd || process.cwd();
  const job = {
    id,
    kind,
    status: "running",
    cwd: dir,
    model,
    background: !!background,
    startedAt: Date.now(),
    pid: null,
    sessionId: null,
    exitCode: null,
    result: null,
  };
  writeJob(dir, job);

  const args = buildArgs({ prompt, model, maxTurns, allowWrite, resume });
  const child = spawn(CLAUDE_BIN, args, { cwd: dir, env: process.env });
  job.pid = child.pid;
  writeJob(dir, job);
  live.set(id, child);

  let stdout = "";
  let stderr = "";
  const timer = setTimeout(() => child.kill("SIGKILL"), DEFAULT_TIMEOUT_MS);

  const done = new Promise((resolve) => {
    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("error", (err) => {
      clearTimeout(timer);
      live.delete(id);
      const cur = readJob(dir, id) || job;
      if (cur.status === "cancelled") return resolve(cur);
      cur.status = "error";
      cur.endedAt = Date.now();
      cur.result =
        `Failed to launch "${CLAUDE_BIN}": ${err.message}\n` +
        `Install Claude Code: npm i -g @anthropic-ai/claude-code`;
      writeJob(dir, cur);
      resolve(cur);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      live.delete(id);
      const cur = readJob(dir, id) || job;
      if (cur.status === "cancelled") return resolve(cur);
      cur.exitCode = code;
      cur.endedAt = Date.now();
      try {
        const parsed = JSON.parse(stdout);
        cur.sessionId = parsed.session_id || null;
        cur.result = parsed.result ?? stdout;
        cur.status = parsed.is_error ? "error" : "done";
        cur.costUsd = parsed.total_cost_usd ?? null;
        cur.numTurns = parsed.num_turns ?? null;
        rememberSession(dir, cur.sessionId);
      } catch {
        cur.result = stdout || stderr || `(no output, exit ${code})`;
        cur.status = code === 0 ? "done" : "error";
      }
      writeJob(dir, cur);
      resolve(cur);
    });
  });

  return { job, done };
}

function fmtJob(j, withResult) {
  const dur = j.endedAt ? `${Math.round((j.endedAt - j.startedAt) / 1000)}s` : "running";
  const meta = [
    `id: ${j.id}`,
    `kind: ${j.kind}`,
    `status: ${j.status}`,
    `dur: ${dur}`,
    j.model ? `model: ${j.model}` : null,
    j.sessionId ? `claude session: ${j.sessionId}` : null,
    typeof j.costUsd === "number" ? `cost: $${j.costUsd.toFixed(4)}` : null,
  ]
    .filter(Boolean)
    .join(" | ");
  if (!withResult) return meta;
  return `${meta}\n\n${j.result ?? "(no result yet)"}` +
    (j.sessionId ? `\n\nResume in Claude: claude --resume ${j.sessionId}` : "");
}

// foreground convenience: run and return text
async function runForeground(opts) {
  const { done } = startJob(opts);
  const j = await done;
  return { text: fmtJob(j, true), ok: j.status === "done" };
}
function startBackground(opts) {
  const { job } = startJob(opts);
  return {
    text:
      `Started ${job.kind} in background.\n${fmtJob(job, false)}\n\n` +
      `Check progress: claude_status (or claude_status "${job.id}")\n` +
      `Get result:     claude_result "${job.id}"\n` +
      `Cancel:         claude_cancel "${job.id}"`,
    ok: true,
  };
}

// ---------- prompts ----------

const reviewRangeInstruction = (ref) => {
  if (ref) {
    return (
      `The requested review base is \`${ref}\`.\n` +
      `Inspect tracked changes with \`git diff ${ref}\` and \`git diff --cached ${ref}\` when useful.\n`
    );
  }
  return (
    `No explicit base was provided.\n` +
    `Start with \`git status --short --branch\`.\n` +
    `If there are working-tree or staged changes, inspect tracked changes with \`git diff HEAD\` and \`git diff --cached\`.\n` +
    `If the working tree is clean but the branch has upstream/base changes, try \`git diff @{upstream}...HEAD\`, then \`git diff origin/main...HEAD\`, \`git diff main...HEAD\`, \`git diff origin/master...HEAD\`, and \`git diff master...HEAD\` as applicable.\n`
  );
};

const untrackedInstruction =
  `Also review untracked files shown by \`git status --short\`: read those files directly instead of assuming \`git diff\` includes them.\n`;

const reviewPrompt = (ref) =>
  `You are a meticulous senior engineer giving an independent second opinion.\n` +
  reviewRangeInstruction(ref) +
  untrackedInstruction +
  `Read related files as needed.\n` +
  `Report prioritized findings as a list: [high/med/low] file:line - issue - suggested fix.\n` +
  `Be concrete; if nothing serious, say so. Do not modify any files.`;

const adversarialPrompt = (ref, focus) =>
  `You are an adversarial reviewer.\n` +
  reviewRangeInstruction(ref) +
  untrackedInstruction +
  `Pressure-test the change.\n` +
  `Challenge the design and approach, not just code details: assumptions, tradeoffs, ` +
  `failure modes, and whether a simpler/safer alternative exists.\n` +
  (focus ? `Focus especially on: ${focus}.\n` : "") +
  `List concrete risks with severity and what you'd change. Do not modify any files.`;

// ---------- server ----------

const server = new McpServer({ name: "claude-for-codex", version: "0.2.0" });

server.registerTool(
  "claude_setup",
  {
    title: "Check Claude Code readiness",
    description: "Check whether the Claude Code CLI is installed and reachable.",
    inputSchema: {},
  },
  async () => {
    const r = spawnSync(CLAUDE_BIN, ["--version"], { encoding: "utf8" });
    if (r.status === 0) {
      return {
        content: [
          {
            type: "text",
            text:
              `Claude Code is installed: ${r.stdout.trim()}\n` +
              `Binary: ${CLAUDE_BIN}, default model: ${DEFAULT_MODEL}\n` +
              `If runs fail with an auth error, run \`claude\` once interactively to log in.`,
          },
        ],
      };
    }
    return {
      content: [
        {
          type: "text",
          text:
            `Claude Code not found via "${CLAUDE_BIN}".\n` +
            `Install: npm i -g @anthropic-ai/claude-code, then run \`claude\` once to authenticate.\n` +
            `Or set CLAUDE_BIN to an absolute path in the MCP server env.`,
        },
      ],
      isError: true,
    };
  }
);

server.registerTool(
  "claude_review",
  {
    title: "Claude code review",
    description:
      "Read-only second-opinion review of current changes. Set background=true for multi-file diffs.",
    inputSchema: {
      base: z.string().optional().describe("git ref to diff against. If omitted, Claude reviews current worktree changes and tries the branch upstream/base when the worktree is clean."),
      background: z.boolean().optional(),
      cwd: z.string().optional(),
    },
  },
  async ({ base, background, cwd }) => {
    const opts = {
      kind: "review",
      prompt: reviewPrompt(base),
      model: DEFAULT_MODEL,
      maxTurns: 25,
      allowWrite: false,
      cwd,
      background,
    };
    const r = background ? startBackground(opts) : await runForeground(opts);
    return { content: [{ type: "text", text: r.text }], isError: !r.ok };
  }
);

server.registerTool(
  "claude_adversarial_review",
  {
    title: "Claude adversarial review",
    description: "Steerable challenge review. Pass focus text to target specific risks. Read-only.",
    inputSchema: {
      base: z.string().optional(),
      focus: z.string().optional().describe('e.g. "auth, data loss, race conditions".'),
      background: z.boolean().optional(),
      cwd: z.string().optional(),
    },
  },
  async ({ base, focus, background, cwd }) => {
    const opts = {
      kind: "adversarial-review",
      prompt: adversarialPrompt(base, focus),
      model: DEFAULT_MODEL,
      maxTurns: 25,
      allowWrite: false,
      cwd,
      background,
    };
    const r = background ? startBackground(opts) : await runForeground(opts);
    return { content: [{ type: "text", text: r.text }], isError: !r.ok };
  }
);

server.registerTool(
  "claude_rescue",
  {
    title: "Delegate a task to Claude",
    description:
      "Hand a task to Claude Code: investigate, fix, or continue work. " +
      "resume=true continues the latest Claude session in this repo; pass a session id to target one. " +
      "allow_write=true lets Claude edit files (uses --dangerously-skip-permissions).",
    inputSchema: {
      task: z.string().describe("What you want Claude to do."),
      model: z.string().optional(),
      resume: z
        .union([z.boolean(), z.string()])
        .optional()
        .describe('true = continue latest repo session; or a specific session id.'),
      fresh: z.boolean().optional().describe("Force a brand-new session (ignore resume)."),
      allow_write: z.boolean().optional(),
      background: z.boolean().optional(),
      cwd: z.string().optional(),
    },
  },
  async ({ task, model, resume, fresh, allow_write, background, cwd }) => {
    let resumeId = null;
    if (!fresh && resume) resumeId = resume === true ? lastSession(cwd) : resume;
    const opts = {
      kind: "rescue",
      prompt: task,
      model: model || DEFAULT_MODEL,
      maxTurns: 40,
      allowWrite: !!allow_write,
      resume: resumeId,
      cwd,
      background,
    };
    const r = background ? startBackground(opts) : await runForeground(opts);
    return { content: [{ type: "text", text: r.text }], isError: !r.ok };
  }
);

server.registerTool(
  "claude_status",
  {
    title: "Claude job status",
    description: "Show running and recent Claude jobs for this repo. Pass a task id for one job.",
    inputSchema: {
      task_id: z.string().optional(),
      cwd: z.string().optional(),
    },
  },
  async ({ task_id, cwd }) => {
    if (task_id) {
      const j = readJob(cwd, task_id);
      if (!j) return { content: [{ type: "text", text: `No job ${task_id}.` }], isError: true };
      return { content: [{ type: "text", text: fmtJob(j, false) }] };
    }
    const jobs = listJobs(cwd).slice(0, 10);
    const text = jobs.length
      ? jobs.map((j) => fmtJob(j, false)).join("\n")
      : "No Claude jobs recorded for this repo yet.";
    return { content: [{ type: "text", text }] };
  }
);

server.registerTool(
  "claude_result",
  {
    title: "Claude job result",
    description: "Show the final output of a finished job (latest if no id). Includes the Claude session id.",
    inputSchema: {
      task_id: z.string().optional(),
      cwd: z.string().optional(),
    },
  },
  async ({ task_id, cwd }) => {
    const j = task_id ? readJob(cwd, task_id) : listJobs(cwd).find((x) => x.status !== "running") || listJobs(cwd)[0];
    if (!j) return { content: [{ type: "text", text: "No job found." }], isError: true };
    if (j.status === "running")
      return { content: [{ type: "text", text: `Job ${j.id} is still running.` }] };
    return { content: [{ type: "text", text: fmtJob(j, true) }], isError: j.status === "error" };
  }
);

server.registerTool(
  "claude_cancel",
  {
    title: "Cancel a Claude job",
    description: "Cancel an active background job (latest running if no id).",
    inputSchema: {
      task_id: z.string().optional(),
      cwd: z.string().optional(),
    },
  },
  async ({ task_id, cwd }) => {
    let j = task_id ? readJob(cwd, task_id) : listJobs(cwd).find((x) => x.status === "running");
    if (!j) return { content: [{ type: "text", text: "No running job to cancel." }], isError: true };
    const child = live.get(j.id);
    if (child) child.kill("SIGKILL");
    if (j.pid) {
      try { process.kill(j.pid, "SIGKILL"); } catch {}
    }
    j.status = "cancelled";
    j.endedAt = Date.now();
    writeJob(j.cwd || cwd, j);
    return { content: [{ type: "text", text: `Cancelled ${j.id}.` }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
