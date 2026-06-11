import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { createClaudeRunner } from "../src/claude-runner.mjs";

function makeTempRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "claude-for-codex-job-"));
  const git = spawnSync("git", ["init", "--quiet"], { cwd: dir });
  assert.equal(git.status, 0, git.stderr.toString());
  return dir;
}

function makeFakeClaude() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "claude-for-codex-fake-bin-"));
  const bin = path.join(dir, "fake-claude.mjs");
  fs.writeFileSync(
    bin,
    `#!/usr/bin/env node
const mode = process.env.FAKE_CLAUDE_MODE || "json";
const delayMs = Number(process.env.FAKE_CLAUDE_DELAY_MS || 0);

setTimeout(() => {
  if (mode === "json") {
    console.log(JSON.stringify({
      session_id: "session-fake-123",
      result: "fake review result",
      total_cost_usd: 0.0123,
      num_turns: 2,
      is_error: false
    }));
    return;
  }

  if (mode === "text") {
    console.log("plain fallback output");
    return;
  }

  if (mode === "exit") {
    console.error("fake failure");
    process.exit(2);
  }
}, delayMs);
`,
    { mode: 0o755 },
  );
  fs.chmodSync(bin, 0o755);
  return bin;
}

function makeRunner({ mode = "json", delayMs = 0, timeoutMs = 5_000, claudeBin = makeFakeClaude() } = {}) {
  const cwd = makeTempRepo();
  const stateRoot = fs.mkdtempSync(path.join(os.tmpdir(), "claude-for-codex-state-root-"));
  const env = {
    ...process.env,
    CLAUDE_BIN: claudeBin,
    CLAUDE_FOR_CODEX_STATE: stateRoot,
    CLAUDE_TIMEOUT_MS: String(timeoutMs),
    FAKE_CLAUDE_MODE: mode,
    FAKE_CLAUDE_DELAY_MS: String(delayMs),
  };
  const runner = createClaudeRunner({ env });
  return { cwd, runner, stateRoot };
}

function reviewOpts(cwd, overrides = {}) {
  return {
    kind: "review",
    prompt: "Review this fake repo.",
    model: "sonnet",
    maxTurns: 3,
    allowWrite: false,
    cwd,
    background: false,
    ...overrides,
  };
}

test("stores Claude JSON output, session metadata, and last session", async () => {
  const { cwd, runner, stateRoot } = makeRunner();
  const { job, done } = runner.startJob(reviewOpts(cwd));

  const completed = await done;
  const persisted = runner.readJob(cwd, job.id);

  assert.equal(completed.status, "done");
  assert.equal(persisted.status, "completed");
  assert.equal(persisted.sessionId, "session-fake-123");
  assert.equal(persisted.result, "fake review result");
  assert.equal(persisted.costUsd, 0.0123);
  assert.equal(persisted.numTurns, 2);
  assert.equal(runner.lastSession(cwd), "session-fake-123");
  assert.equal(fs.realpathSync.native(persisted.workspaceRoot), fs.realpathSync.native(cwd));
  assert.equal(fs.realpathSync.native(persisted.cwd), fs.realpathSync.native(cwd));
  assert.ok(fs.existsSync(stateRoot));

  const result = runner.resultText({ taskId: job.id, cwd });
  assert.equal(result.isError, false);
  assert.match(result.text, /fake review result/);
  assert.match(result.text, /Resume in Claude: claude --resume session-fake-123/);
  assert.match(result.text, /no files were edited/);
});

test("preserves malformed JSON text fallback", async () => {
  const { cwd, runner } = makeRunner({ mode: "text" });
  const { job, done } = runner.startJob(reviewOpts(cwd));

  const completed = await done;

  assert.equal(completed.status, "done");
  assert.match(completed.result, /plain fallback output/);
  assert.match(completed.result, /Failure category: malformed JSON/);
  assert.match(completed.result, /text fallback/);
  assert.equal(runner.readJob(cwd, job.id).status, "completed");
});

test("returns actionable guidance for non-zero exits and missing binaries", async () => {
  const exitRun = makeRunner({ mode: "exit" });
  const exitJob = exitRun.runner.startJob(reviewOpts(exitRun.cwd));
  const failed = await exitJob.done;

  assert.equal(failed.status, "error");
  assert.match(failed.result, /fake failure/);
  assert.match(failed.result, /Failure category: claude exit/);
  assert.match(failed.result, /Claude exited with code 2/);

  const missingBin = path.join(os.tmpdir(), "definitely-missing-claude-for-codex");
  const missingRun = makeRunner({ claudeBin: missingBin });
  const missingJob = missingRun.runner.startJob(reviewOpts(missingRun.cwd));
  const missing = await missingJob.done;

  assert.equal(missing.status, "error");
  assert.match(missing.result, /Failure category: missing binary/);
  assert.match(missing.result, /CLAUDE_BIN/);
  assert.match(missing.result, new RegExp(escapeRegExp(missingBin)));
});

test("makes timeout behavior deterministic with a short test timeout", async () => {
  const { cwd, runner } = makeRunner({ delayMs: 1_000, timeoutMs: 30 });
  const { done } = runner.startJob(reviewOpts(cwd));

  const timedOut = await done;

  assert.equal(timedOut.status, "error");
  assert.match(timedOut.result, /Failure category: timeout/);
  assert.match(timedOut.result, /Claude was killed after 30ms/);
});

test("reports background status, running result, and final result", async () => {
  const { cwd, runner } = makeRunner({ delayMs: 150 });

  const started = runner.startBackground(reviewOpts(cwd, { background: true }));

  assert.equal(started.ok, true);
  assert.match(started.text, /Started review in background/);
  assert.match(started.text, new RegExp(`claude_status "${started.job.id}"`));
  assert.match(started.text, new RegExp(`claude_result "${started.job.id}"`));
  assert.match(started.text, new RegExp(`claude_cancel "${started.job.id}"`));

  const status = runner.statusText({ cwd });
  assert.equal(status.isError, false);
  assert.match(status.text, new RegExp(`id: ${started.job.id}`));
  assert.match(status.text, /status: running/);

  const runningResult = runner.resultText({ taskId: started.job.id, cwd });
  assert.equal(runningResult.isError, false);
  assert.match(runningResult.text, new RegExp(`Job ${started.job.id} is still running`));

  await started.done;

  const finalResult = runner.resultText({ taskId: started.job.id, cwd });
  assert.equal(finalResult.isError, false);
  assert.match(finalResult.text, /fake review result/);
  assert.match(finalResult.text, /claude session: session-fake-123/);

  const recentStatus = runner.statusText({ cwd });
  assert.equal(recentStatus.isError, false);
  assert.match(recentStatus.text, new RegExp(`id: ${started.job.id}`));
  assert.match(recentStatus.text, /status: completed/);
});

test("returns latest completed result when no task id is provided", async () => {
  const { cwd, runner } = makeRunner({ delayMs: 150 });

  const completed = runner.startBackground(reviewOpts(cwd, { background: true }));
  await completed.done;

  await new Promise((resolve) => setTimeout(resolve, 5));
  const running = runner.startBackground(reviewOpts(cwd, { background: true }));

  const defaultResult = runner.resultText({ cwd });
  assert.equal(defaultResult.isError, false);
  assert.match(defaultResult.text, new RegExp(`id: ${completed.job.id}`));
  assert.doesNotMatch(defaultResult.text, new RegExp(`Job ${running.job.id} is still running`));
  assert.match(defaultResult.text, /fake review result/);

  runner.cancelJob({ taskId: running.job.id, cwd });
  await running.done;
});

test("cancels only process-lifetime jobs owned by this MCP server", async () => {
  const run = makeRunner({ delayMs: 1_000 });
  const started = run.runner.startBackground(reviewOpts(run.cwd, { background: true }));

  const observer = createClaudeRunner({
    env: {
      ...process.env,
      CLAUDE_BIN: makeFakeClaude(),
      CLAUDE_FOR_CODEX_STATE: run.stateRoot,
      CLAUDE_TIMEOUT_MS: "5000",
    },
  });
  const observerCancel = observer.cancelJob({ taskId: started.job.id, cwd: run.cwd });

  assert.equal(observerCancel.isError, true);
  assert.match(observerCancel.text, /process-lifetime only/);
  assert.match(observerCancel.text, /not a durable queue cancellation/);

  const cancel = run.runner.cancelJob({ taskId: started.job.id, cwd: run.cwd });
  assert.equal(cancel.isError, false);
  assert.match(cancel.text, /Cancelled/);
  assert.match(cancel.text, /best effort/);
  assert.match(cancel.text, /process-lifetime only/);
  assert.match(cancel.text, /not a durable queue cancellation/);

  const cancelled = await started.done;
  assert.equal(cancelled.status, "cancelled");
  assert.equal(run.runner.readJob(run.cwd, started.job.id).status, "cancelled");
});

test("exposes repo-read consent state without launching Claude", () => {
  let spawnCount = 0;
  const cwd = makeTempRepo();
  const stateRoot = fs.mkdtempSync(path.join(os.tmpdir(), "claude-for-codex-state-root-"));
  const runner = createClaudeRunner({
    env: {
      ...process.env,
      CLAUDE_BIN: makeFakeClaude(),
      CLAUDE_FOR_CODEX_STATE: stateRoot,
    },
    spawnFn(...args) {
      spawnCount += 1;
      return createClaudeRunner().startJob(...args);
    },
  });

  assert.equal(runner.repoReadConsent(cwd), null);
  runner.setRepoReadConsent(cwd, { updatedAt: "2026-06-11T00:00:00.000Z" });
  assert.deepEqual(runner.repoReadConsent(cwd), {
    allowed: true,
    updatedAt: "2026-06-11T00:00:00.000Z",
  });
  runner.clearRepoReadConsent(cwd);
  assert.equal(runner.repoReadConsent(cwd), null);
  assert.equal(spawnCount, 0);
});

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
