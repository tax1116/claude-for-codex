import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { URL } from "node:url";

const docs = {
  readme: read("README.md"),
  setup: read("docs/SETUP.md"),
  design: read("docs/DESIGN.md"),
  publishing: read("docs/PUBLISHING.md"),
  reviewPrompt: read("prompts/claude-review.md"),
  adversarialPrompt: read("prompts/claude-adversarial.md"),
  rescuePrompt: read("prompts/claude-rescue.md"),
};
const packageJson = JSON.parse(read("package.json"));
const skillFiles = [
  ["claude-review", "claude.claude_review"],
  ["claude-adversarial", "claude.claude_adversarial_review"],
  ["claude-rescue", "claude.claude_rescue"],
  ["claude-setup", "claude.claude_setup"],
];
const bannedDesignReviewName = ["claude", "design-review"].join("-");
const bannedDesignReviewSkill = `$${bannedDesignReviewName}`;

test("Codex skills are the standard team workflow surface", () => {
  const combinedDocs = `${docs.readme}\n${docs.setup}\n${docs.design}`;

  for (const [skillName, toolName] of skillFiles) {
    const skillText = read(`skills/${skillName}/SKILL.md`);
    assertIncludes(skillText, `name: "${skillName}"`, `${skillName}: frontmatter name`);
    assertIncludes(skillText, toolName, `${skillName}: MCP tool`);
    assert.doesNotMatch(skillText, new RegExp(`${bannedDesignReviewName}|\\${bannedDesignReviewSkill}`));
  }

  for (const skillName of ["claude-review", "claude-adversarial", "claude-rescue"]) {
    const skillText = read(`skills/${skillName}/SKILL.md`);
    for (const expected of [
      "allow once",
      "always allow for this repository",
      "cancel",
      "repo_read_consent",
      "repo-read consent is not write permission",
    ]) {
      assertIncludes(skillText, expected, `${skillName}: ${expected}`);
    }
  }

  assertPackageIncludes("skills/");
  assertIncludes(combinedDocs, "$claude-review", "docs: $claude-review");
  assertIncludes(combinedDocs, "$claude-setup", "docs: $claude-setup");
  assertIncludes(combinedDocs, "cp -R skills/* ~/.codex/skills/", "docs: skill install command");
  assertBefore(combinedDocs, "$claude-review", "/claude-review");
  assertIncludes(docs.design, "MCP tools remain the source of truth", "DESIGN: MCP source of truth");
});

test("slash prompts are compatibility aliases for the skill-first workflow", () => {
  for (const [name, text] of [
    ["review prompt", docs.reviewPrompt],
    ["adversarial prompt", docs.adversarialPrompt],
    ["rescue prompt", docs.rescuePrompt],
  ]) {
    assertIncludes(text, "compatibility alias", `${name}: compatibility alias`);
    assert.doesNotMatch(text, /Standard team path/);
  }

  assertIncludes(docs.reviewPrompt, "/claude-review", "review prompt command");
  assertIncludes(docs.adversarialPrompt, "/claude-adversarial", "adversarial prompt command");
  assertIncludes(docs.rescuePrompt, "/claude-rescue", "rescue prompt command");

  for (const [name, text] of [
    ["review prompt", docs.reviewPrompt],
    ["adversarial prompt", docs.adversarialPrompt],
  ]) {
    for (const expected of [
      "compatibility alias",
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

test("README teaches skill rollout before MCP reference details", () => {
  for (const expected of [
    "Node.js >= 18.18",
    "npm install",
    "absolute path",
    "$claude-setup",
    "$claude-review",
    "$claude-adversarial",
    "cp -R skills/* ~/.codex/skills/",
    "MCP tool names",
    "reference interface",
    "compatibility aliases",
    "not affiliated with, endorsed by, or sponsored by",
    "advanced",
    "opt-in",
    "loop",
    "blocking",
    "usage-cost",
  ]) {
    assertIncludes(docs.readme, expected, `README: ${expected}`);
  }

  assertBefore(docs.readme, "$claude-review", "## Tools");
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
    "Standard Codex skill workflow",
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
    "$claude-review base=origin/dev",
    "$claude-adversarial focus=",
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

test("docs keep hooks advanced, opt-in, reversible, and risky", () => {
  const combinedDocs = `${docs.readme}\n${docs.setup}\n${docs.design}`;

  for (const expected of [
    "manual Codex skill workflow",
    "not part of the default install",
    "advanced opt-in",
    "Hooks are enabled by default",
    "Stop` matcher is unused",
    "commandWindows",
    "Disable checklist",
    "Remove this plugin's `hooks.Stop` block",
    "[features] hooks = false",
    "loop",
    "blocking at turn completion",
    "usage-cost risk",
  ]) {
    assertIncludes(combinedDocs, expected, `hook docs: ${expected}`);
  }
});

test("docs keep write-capable rescue outside standard v1 review", () => {
  const combinedDocs = `${docs.readme}\n${docs.setup}\n${docs.design}`;

  for (const expected of [
    "claude_rescue",
    "allow_write: true",
    "outside the standard v1 review path",
    "--dangerously-skip-permissions",
    "broad write permissions",
    "trusted repos",
  ]) {
    assertIncludes(combinedDocs, expected, `rescue docs: ${expected}`);
  }
});

test("docs teach repo-read consent choices and revocation", () => {
  const combinedDocs = `${docs.readme}\n${docs.setup}\n${docs.design}`;

  for (const expected of [
    "Claude Code may read this repo's diff, related files, and selected planning docs",
    "allow once",
    "always allow for this repository",
    "cancel",
    "claude_consent_status",
    "claude_consent_revoke",
    "repo-read consent is not write permission",
  ]) {
    assertIncludes(combinedDocs, expected, `repo-read consent docs: ${expected}`);
  }

  assertIncludes(docs.design, "review, adversarial review, and rescue", "DESIGN: shared consent scope");
  assertIncludes(docs.design, "does not receive the full Codex chat automatically", "DESIGN: Codex chat boundary");
  assert.doesNotMatch(combinedDocs, /Claude receives the full Codex chat/i);
});

test("release-facing docs mark time-sensitive claims for release-date revalidation", () => {
  const combinedDocs = `${docs.readme}\n${docs.setup}\n${docs.design}\n${docs.publishing}`;

  for (const expected of [
    "Release-date revalidation",
    "2026-06-10",
    "Codex CLI/MCP config",
    "hook behavior",
    "Claude Code CLI behavior",
    "model aliases",
    "billing/Agent SDK usage",
    "npm package setup",
    "official docs",
  ]) {
    assertIncludes(combinedDocs, expected, `release revalidation: ${expected}`);
  }
});

test("publishing docs use dev to master PR promotion policy", () => {
  for (const expected of [
    "`dev` to `master`",
    "PR promotion",
    "CI",
    "branch protection",
    "do not delete `dev`",
  ]) {
    assertIncludes(docs.publishing, expected, `publishing: ${expected}`);
  }
});

test("publishing docs separate product milestones from package semver", () => {
  const combinedDocs = `${docs.readme}\n${docs.publishing}`;

  for (const expected of [
    "Semantic Versioning",
    "product milestone labels",
    "not package version `1.0.0`",
    "`0.x.y`",
    "`1.0.0`",
    "team workflow is stable",
  ]) {
    assertIncludes(combinedDocs, expected, `versioning: ${expected}`);
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

  assertPackageIncludes("skills/");
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
