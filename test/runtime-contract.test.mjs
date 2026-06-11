import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { URL } from "node:url";

const serverSource = readFileSync(new URL("../server.mjs", import.meta.url), "utf8");
const runnerSource = readFileSync(new URL("../src/claude-runner.mjs", import.meta.url), "utf8");
const hookSource = readFileSync(new URL("../hooks/review-gate.mjs", import.meta.url), "utf8");
const runtimeSource = `${serverSource}\n${runnerSource}\n${hookSource}`;

function sectionBetween(start, end) {
  const startIndex = serverSource.indexOf(start);
  assert.notEqual(startIndex, -1, `Missing section start: ${start}`);
  const endIndex = serverSource.indexOf(end, startIndex + start.length);
  assert.notEqual(endIndex, -1, `Missing section end: ${end}`);
  return serverSource.slice(startIndex, endIndex);
}

test("claude_review exposes optional focus without enabling writes", () => {
  const reviewTool = sectionBetween(
    'server.registerTool(\n  "claude_review"',
    'server.registerTool(\n  "claude_adversarial_review"',
  );

  assert.match(reviewTool, /focus:\s*z\.string\(\)\.optional\(\)/);
  assert.match(reviewTool, /allowWrite:\s*false/);
});

test("review prompts include explicit Codex context and output contract", () => {
  for (const expected of [
    "full Codex chat",
    "git status --short --branch",
    ".planning/PROJECT.md",
    ".planning/REQUIREMENTS.md",
    ".planning/ROADMAP.md",
    "01-CONTEXT.md",
    "High",
    "Medium",
    "Low",
    "No high-confidence findings",
    "missing tests",
    "cancellation",
    "resume",
    "context limits",
    "failure modes",
  ]) {
    assert.match(runtimeSource, new RegExp(escapeRegExp(expected)), expected);
  }
});

test("read-only review results and failures have a predictable shape", () => {
  for (const expected of [
    "no files were edited",
    "missing binary",
    "auth/reachability",
    "timeout",
    "malformed JSON",
    "text fallback",
    "context too large",
  ]) {
    assert.match(runtimeSource, new RegExp(escapeRegExp(expected)), expected);
  }
});

test("setup diagnostics name Claude configuration and live-review gaps", () => {
  for (const expected of [
    "CLAUDE_BIN",
    "CLAUDE_MODEL",
    "CLAUDE_TIMEOUT_MS",
    "tool_timeout_sec",
    "Codex skills",
    "claude-review",
    "claude-adversarial",
    "claude-rescue",
    "claude-setup",
    "cp -R skills/* ~/.codex/skills/",
    "claude auth status",
    "live review reachability may still fail",
  ]) {
    assert.match(serverSource, new RegExp(escapeRegExp(expected)), expected);
  }
});

test("write-capable rescue remains an explicit escape hatch", () => {
  const rescueTool = sectionBetween(
    'server.registerTool(\n  "claude_rescue"',
    'server.registerTool(\n  "claude_status"',
  );

  for (const expected of [
    "outside the standard v1 review path",
    "allow_write=true",
    "--dangerously-skip-permissions",
    "broad write permissions",
    "trusted repos",
  ]) {
    assert.match(rescueTool, new RegExp(escapeRegExp(expected)), expected);
  }

  assert.match(runnerSource, /if \(allowWrite\) args\.push\("--dangerously-skip-permissions"\)/);
  assert.match(runnerSource, /else\s*\{\s*args\.push\("--allowedTools"/);
});

test("hook source says the Stop gate is advanced, opt-in, reversible, and blocking", () => {
  for (const expected of [
    "advanced opt-in",
    "not part of the default install",
    "Disable checklist",
    "hooks = false",
    "blocking at turn completion",
    "usage-cost risk",
  ]) {
    assert.match(hookSource, new RegExp(escapeRegExp(expected)), expected);
  }
});

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
