#!/usr/bin/env node
/**
 * Codex Stop hook: run a quick Claude review before Codex finalizes a turn.
 * This advanced opt-in hook is not part of the default install.
 * If Claude flags blocking issues, exit 2 (Codex blocks the stop and feeds the
 * reason back to the agent). Otherwise exit 0. That can cause blocking at turn
 * completion, so use it only when intentionally monitoring automation.
 *
 * Wire it up in ~/.codex/config.toml (requires the hooks feature flag):
 *
 *   [features]
 *   hooks = true
 *
 *   [[hooks.Stop]]
 *   matcher = ".*"
 *   [[hooks.Stop.hooks]]
 *   type = "command"
 *   command = 'node "/ABS/PATH/claude-for-codex/hooks/review-gate.mjs"'
 *   timeout = 300
 *
 * Disable checklist:
 *   1. Remove this plugin's hooks.Stop block from the active Codex config.
 *   2. Or disable the individual hook through /hooks.
 *   3. Set hooks = false when all hooks in that config layer should be off.
 *
 * WARNING: this can create a long Codex<->Claude loop, blocking at turn completion,
 * and usage-cost risk.
 * Enable it only when you are actively monitoring the session.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";

const CLAUDE_BIN = process.env.CLAUDE_BIN || "claude";

function readStdin() {
  try {
    return fs.readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

let cwd = process.cwd();
try {
  const evt = JSON.parse(readStdin() || "{}");
  if (evt.cwd) cwd = evt.cwd;
} catch {}

const prompt =
  "Review the current uncommitted changes.\n" +
  "Start with `git status --short`. Inspect tracked changes via `git diff HEAD` and `git diff --cached`.\n" +
  "Also review untracked files shown by status by reading those files directly.\n" +
  "If there is a BLOCKING problem (bug, security hole, data loss, broken build), " +
  "respond with a single line starting `BLOCK:` then a one-sentence reason.\n" +
  "Otherwise respond with exactly `OK`. Do not modify files.";

const r = spawnSync(
  CLAUDE_BIN,
  [
    "-p", prompt,
    "--output-format", "json",
    "--model", process.env.CLAUDE_MODEL || "sonnet",
    "--max-turns", "12",
    "--allowedTools", "Read,Grep,Glob,Bash(git diff:*),Bash(git status:*)",
    "--disallowedTools", "Edit,Write,MultiEdit",
  ],
  { cwd, encoding: "utf8", timeout: 280_000 }
);

let verdict = "OK";
try {
  verdict = (JSON.parse(r.stdout).result || "").trim();
} catch {
  verdict = (r.stdout || "").trim();
}

if (/^BLOCK:/i.test(verdict)) {
  process.stderr.write("Claude review gate: " + verdict.replace(/^BLOCK:\s*/i, ""));
  process.exit(2); // block the stop; reason is fed back to Codex
}
process.exit(0);
