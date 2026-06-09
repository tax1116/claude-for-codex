import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { URL } from "node:url";

const docs = {
  readme: read("README.md"),
  setup: read("docs/SETUP.md"),
  design: read("docs/DESIGN.md"),
  reviewPrompt: read("prompts/claude-review.md"),
  adversarialPrompt: read("prompts/claude-adversarial.md"),
};
const packageJson = JSON.parse(read("package.json"));

test("slash prompts expose the standard team review contracts", () => {
  assertIncludes(docs.reviewPrompt, "/claude-review", "review prompt command");
  assertIncludes(docs.adversarialPrompt, "/claude-adversarial", "adversarial prompt command");

  for (const [name, text] of [
    ["review prompt", docs.reviewPrompt],
    ["adversarial prompt", docs.adversarialPrompt],
  ]) {
    for (const expected of [
      "Standard team path",
      "base",
      "focus",
      "background: true",
      "High",
      "Medium",
      "Low",
      "No high-confidence findings",
      "no files were edited",
    ]) {
      assertIncludes(text, expected, `${name}: ${expected}`);
    }
  }

  for (const expected of ["missing tests", "cancellation", "resume", "context limits", "failure modes"]) {
    assertIncludes(docs.reviewPrompt, expected, `review prompt: ${expected}`);
  }

  for (const expected of ["architecture boundaries", "complexity", "assumptions", "simpler alternatives"]) {
    assertIncludes(docs.adversarialPrompt, expected, `adversarial prompt: ${expected}`);
  }
});

test("README teaches slash-command rollout before MCP reference details", () => {
  for (const expected of [
    "Node.js >= 18.18",
    "npm install",
    "absolute path",
    "claude_setup",
    "/claude-review",
    "/claude-adversarial",
    "MCP tool names",
    "reference interface",
    "not affiliated with, endorsed by, or sponsored by",
    "advanced",
    "opt-in",
    "loop",
    "blocking",
    "usage-cost",
  ]) {
    assertIncludes(docs.readme, expected, `README: ${expected}`);
  }

  assertBefore(docs.readme, "/claude-review", "## Tools");
  assert.doesNotMatch(docs.readme, /planned direction is Node \+ TypeScript/i);
  assert.doesNotMatch(docs.readme, /intended team-ready shape is Node \+ TypeScript/i);
});

test("README-linked docs are included in the npm package", () => {
  const linkedDocs = [...docs.readme.matchAll(/\]\((docs\/[^)]+\.md)\)/g)].map((match) => match[1]);
  assert.ok(linkedDocs.length > 0, "README should link packaged docs");

  for (const linkedDoc of linkedDocs) {
    assertPackageIncludes(linkedDoc);
  }
});

test("setup and design docs explain context, boundaries, and failures", () => {
  for (const expected of [
    "Standard slash-command workflow",
    "missing binary",
    "auth/reachability",
    "timeout",
    "malformed JSON",
    "context",
  ]) {
    assertIncludes(docs.setup, expected, `SETUP: ${expected}`);
  }

  for (const expected of [
    "Explicit context contract",
    "resume",
    "Claude Code session continuity",
    ".planning/PROJECT.md",
    ".planning/REQUIREMENTS.md",
    ".planning/ROADMAP.md",
    "CONTEXT.md",
  ]) {
    assertIncludes(docs.design, expected, `DESIGN: ${expected}`);
  }

  for (const [name, text] of [
    ["SETUP", docs.setup],
    ["DESIGN", docs.design],
  ]) {
    assertIncludes(text, "read-only", `${name}: read-only`);
    assertIncludes(text, "full Codex chat", `${name}: full Codex chat boundary`);
  }
});

test("docs teach base, focus, background, and cancellation boundaries", () => {
  const combinedDocs = `${docs.readme}\n${docs.setup}\n${docs.design}`;

  for (const expected of [
    "/claude-review base=origin/dev",
    "/claude-adversarial focus=",
    "background: true",
    "claude_status",
    "claude_result",
    "claude_cancel",
    "best effort",
    "process-lifetime",
    "not a hosted durable queue",
  ]) {
    assertIncludes(combinedDocs, expected, `docs: ${expected}`);
  }
});

test("server runtime imports stay covered by npm package files", () => {
  const serverSource = read("server.mjs");
  const runtimeImports = [...serverSource.matchAll(/from "\.\/(src\/[^"]+)"/g)].map((match) => match[1]);

  assert.ok(runtimeImports.length > 0, "server should import runtime helpers from src");
  for (const runtimeImport of runtimeImports) {
    assertPackageCovers(runtimeImport);
  }

  for (const expected of ["server.mjs", "src/", "hooks/", "prompts/", "README.md", "LICENSE", "NOTICE"]) {
    assertPackageIncludes(expected);
  }
});

function read(relativePath) {
  return readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");
}

function assertIncludes(text, expected, label) {
  assert.ok(text.includes(expected), label);
}

function assertBefore(text, first, second) {
  const firstIndex = text.indexOf(first);
  const secondIndex = text.indexOf(second);
  assert.notEqual(firstIndex, -1, `Missing ${first}`);
  assert.notEqual(secondIndex, -1, `Missing ${second}`);
  assert.ok(firstIndex < secondIndex, `${first} should appear before ${second}`);
}

function assertPackageIncludes(relativePath) {
  assert.ok(
    packageJson.files.includes(relativePath),
    `package.json files should include README-linked ${relativePath}`,
  );
}

function assertPackageCovers(relativePath) {
  assert.ok(
    packageJson.files.some((entry) => entry === relativePath || (entry.endsWith("/") && relativePath.startsWith(entry))),
    `package.json files should cover runtime helper ${relativePath}`,
  );
}
