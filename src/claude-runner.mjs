import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { StateStore, resolveStateRoot } from "./state-store.mjs";

export const READ_ONLY_ALLOW =
  "Read,Grep,Glob,Bash(git diff:*),Bash(git log:*),Bash(git status:*),Bash(git show:*)";
export const WRITE_DISALLOW = "Edit,Write,MultiEdit,NotebookEdit";

export function buildArgs({ prompt, model, maxTurns, allowWrite, resume }) {
  const args = ["-p", prompt, "--output-format", "json", "--model", model, "--max-turns", String(maxTurns)];
  if (resume) args.push("--resume", resume);
  if (allowWrite) args.push("--dangerously-skip-permissions");
  else {
    args.push("--allowedTools", READ_ONLY_ALLOW);
    args.push("--disallowedTools", WRITE_DISALLOW);
  }
  return args;
}

export function createClaudeRunner({
  env = process.env,
  spawnFn = spawn,
  idFactory = newId,
  now = () => Date.now(),
} = {}) {
  const claudeBin = env.CLAUDE_BIN || "claude";
  const defaultModel = env.CLAUDE_MODEL || "sonnet";
  const defaultTimeoutMs = Number(env.CLAUDE_TIMEOUT_MS || 600_000);
  const stateRoot = resolveStateRoot(env);
  const live = new Map();

  function storeFor(cwd) {
    return new StateStore({ cwd: cwd || process.cwd(), stateRoot });
  }

  function writeJob(cwd, job) {
    return storeFor(cwd).writeJob(job);
  }

  function readJob(cwd, id) {
    return storeFor(cwd).readJob(id);
  }

  function listJobs(cwd) {
    return storeFor(cwd).listJobs();
  }

  function rememberSession(cwd, sid) {
    storeFor(cwd).rememberSession(sid);
  }

  function lastSession(cwd) {
    return storeFor(cwd).lastSession();
  }

  function maybeFailureGuidance({ code, stderr, stdout, timedOut }) {
    const output = `${stdout}\n${stderr}`.toLowerCase();
    if (timedOut) return failureGuidance("timeout", `Claude was killed after ${defaultTimeoutMs}ms.`);
    if (output.includes("context") && (output.includes("too large") || output.includes("maximum"))) {
      return failureGuidance("context too large", "Claude reported that the prompt or repository context was too large.");
    }
    if (output.includes("auth") || output.includes("login") || output.includes("api key")) {
      return failureGuidance("auth/reachability", "Claude appears unavailable because authentication or service reachability failed.");
    }
    if (code && code !== 0) return failureGuidance("claude exit", `Claude exited with code ${code}.`);
    return null;
  }

  function startJob({ kind, prompt, model, maxTurns, allowWrite, resume, cwd, background }) {
    const id = idFactory();
    const dir = cwd || process.cwd();
    const job = {
      id,
      kind,
      status: "running",
      cwd: dir,
      model,
      background: !!background,
      startedAt: now(),
      pid: null,
      sessionId: null,
      exitCode: null,
      result: null,
    };
    writeJob(dir, job);

    const args = buildArgs({ prompt, model, maxTurns, allowWrite, resume });
    const child = spawnFn(claudeBin, args, { cwd: dir, env });
    job.pid = child.pid || null;
    writeJob(dir, job);
    live.set(id, child);

    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, defaultTimeoutMs);

    const done = new Promise((resolve) => {
      child.stdout.on("data", (d) => (stdout += d.toString()));
      child.stderr.on("data", (d) => (stderr += d.toString()));
      child.on("error", (err) => {
        clearTimeout(timer);
        live.delete(id);
        const cur = readJob(dir, id) || job;
        if (cur.status === "cancelled") return resolve(cur);
        cur.status = "error";
        cur.endedAt = now();
        cur.result = failureGuidance(
          "missing binary",
          `Failed to launch "${claudeBin}": ${err.message}`,
        );
        writeJob(dir, cur);
        resolve(cur);
      });
      child.on("close", (code) => {
        clearTimeout(timer);
        live.delete(id);
        const cur = readJob(dir, id) || job;
        if (cur.status === "cancelled") return resolve(cur);
        if (cur.status !== "running") return resolve(cur);
        cur.exitCode = code;
        cur.endedAt = now();
        try {
          const parsed = JSON.parse(stdout);
          cur.sessionId = parsed.session_id || null;
          cur.result = parsed.result ?? stdout;
          cur.status = parsed.is_error ? "error" : "done";
          cur.costUsd = parsed.total_cost_usd ?? null;
          cur.numTurns = parsed.num_turns ?? null;
          if (cur.status === "error") {
            cur.result = appendGuidance(cur.result, maybeFailureGuidance({ code, stderr, stdout, timedOut }));
          }
          rememberSession(dir, cur.sessionId);
        } catch {
          cur.result = appendGuidance(
            stdout || stderr || `(no output, exit ${code})`,
            failureGuidance("malformed JSON", "Claude output was not valid JSON; using text fallback."),
          );
          cur.result = appendGuidance(cur.result, maybeFailureGuidance({ code, stderr, stdout, timedOut }));
          cur.status = code === 0 ? "done" : "error";
        }
        writeJob(dir, cur);
        resolve(cur);
      });
    });

    return { job, done };
  }

  async function runForeground(opts) {
    const { done } = startJob(opts);
    const j = await done;
    return { text: fmtJob(j, true), ok: j.status === "done" };
  }

  function startBackground(opts) {
    const { job, done } = startJob(opts);
    return {
      job,
      done,
      text:
        `Started ${job.kind} in background.\n${fmtJob(job, false)}\n\n` +
        `Check progress: claude_status (or claude_status "${job.id}")\n` +
        `Get result:     claude_result "${job.id}"\n` +
        `Cancel:         claude_cancel "${job.id}"`,
      ok: true,
    };
  }

  function statusText({ taskId, cwd } = {}) {
    if (taskId) {
      const j = readJob(cwd, taskId);
      if (!j) return { text: `No job ${taskId}.`, isError: true };
      return { text: fmtJob(j, false), isError: false };
    }
    const jobs = listJobs(cwd).slice(0, 10);
    const text = jobs.length
      ? jobs.map((j) => fmtJob(j, false)).join("\n")
      : "No Claude jobs recorded for this repo yet.";
    return { text, isError: false };
  }

  function resultText({ taskId, cwd } = {}) {
    const jobs = listJobs(cwd);
    const j = taskId ? readJob(cwd, taskId) : jobs.find((x) => x.status !== "running") || jobs[0];
    if (!j) return { text: "No job found.", isError: true };
    if (j.status === "running") return { text: `Job ${j.id} is still running.`, isError: false };
    return { text: fmtJob(j, true), isError: j.status === "error" };
  }

  function cancelJob({ taskId, cwd } = {}) {
    const j = taskId ? readJob(cwd, taskId) : listJobs(cwd).find((x) => x.status === "running");
    if (!j) return { text: "No running job to cancel.", isError: true };

    const child = live.get(j.id);
    if (!child) {
      return {
        text:
          `Cannot cancel ${j.id}: this MCP server process no longer owns the Claude child process.\n` +
          "Cancellation is best effort and process-lifetime only; it is not a durable queue cancellation.",
        isError: true,
      };
    }

    child.kill("SIGKILL");
    j.status = "cancelled";
    j.endedAt = now();
    writeJob(j.cwd || cwd, j);
    return {
      text:
        `Cancelled ${j.id}.\n` +
        "Cancellation is best effort and process-lifetime only while this MCP server owns the Claude child process. " +
        "This is not a durable queue cancellation.",
      isError: false,
    };
  }

  return {
    claudeBin,
    defaultModel,
    defaultTimeoutMs,
    startJob,
    runForeground,
    startBackground,
    statusText,
    resultText,
    cancelJob,
    fmtJob,
    readJob,
    listJobs,
    lastSession,
  };
}

function newId() {
  return "task-" + randomBytes(5).toString("hex");
}

function failureGuidance(kind, detail) {
  const lines = [
    `Failure category: ${kind}`,
    detail,
    "Recovery guide:",
    "- missing binary: install Claude Code or set CLAUDE_BIN to an absolute path.",
    "- auth/reachability: run `claude auth status` if available, or run `claude` once interactively.",
    "- timeout: increase CLAUDE_TIMEOUT_MS and the MCP client tool_timeout_sec together.",
    "- malformed JSON: Claude did not return JSON; the text fallback above is preserved for debugging.",
    "- context too large: retry with a narrower base, focus, or background prompt.",
  ];
  return lines.filter(Boolean).join("\n");
}

function appendGuidance(result, guidance) {
  if (!guidance) return result;
  return `${result || "(no output)"}\n\n${guidance}`;
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
  const readOnlyFooter = ["review", "adversarial-review"].includes(j.kind)
    ? "\n\nRead-only review mode: Claude was not allowed to edit files, and no files were edited by this tool."
    : "";
  return `${meta}\n\n${j.result ?? "(no result yet)"}${readOnlyFooter}` +
    (j.sessionId ? `\n\nResume in Claude: claude --resume ${j.sessionId}` : "");
}
