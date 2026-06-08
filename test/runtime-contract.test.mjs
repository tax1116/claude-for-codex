import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const serverSource = readFileSync(new URL("../server.mjs", import.meta.url), "utf8");

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
    assert.match(serverSource, new RegExp(escapeRegExp(expected)), expected);
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
    assert.match(serverSource, new RegExp(escapeRegExp(expected)), expected);
  }
});

test("setup diagnostics name Claude configuration and live-review gaps", () => {
  for (const expected of [
    "CLAUDE_BIN",
    "CLAUDE_MODEL",
    "CLAUDE_TIMEOUT_MS",
    "tool_timeout_sec",
    "claude auth status",
    "live review reachability may still fail",
  ]) {
    assert.match(serverSource, new RegExp(escapeRegExp(expected)), expected);
  }
});

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
