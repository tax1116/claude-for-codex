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
 *   claude_consent_status     - inspect repo-read consent for this repo
 *   claude_consent_revoke     - revoke repo-read consent for this repo
 *   claude_status             - list running/recent jobs for this repo
 *   claude_result             - final output of a finished job (+ Claude session id)
 *   claude_cancel             - cancel an active background job
 *
 * All long-running tools accept background=true and return a task id immediately.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createClaudeRunner } from "./src/claude-runner.mjs";

const claude = createClaudeRunner();
const expectedCodexSkills = ["claude-review", "claude-adversarial", "claude-rescue", "claude-setup"];
const repoReadConsentSchema = z
  .enum(["allow_once", "allow_repo", "cancel"])
  .optional()
  .describe("Repo-read consent choice: allow_once, allow_repo, or cancel.");
const repoReadConsentNotice =
  "Claude Code may read this repo's diff, related files, and selected planning docs.";

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

const planningContextInstruction =
  `You do not receive the full Codex chat. Reconstruct context from the repository and these planning files when present: ` +
  `.planning/PROJECT.md, .planning/REQUIREMENTS.md, .planning/ROADMAP.md, ` +
  `.planning/phases/01-manual-design-risk-review-core/01-CONTEXT.md.\n` +
  `Start every review by checking \`git status --short --branch\` before reading diffs or untracked files.\n`;

const reviewOutputInstruction =
  `Use severities exactly as High, Medium, or Low. ` +
  `For each finding include file:line, issue, impact, and suggested fix. ` +
  `If there are no high-confidence issues, say exactly: No high-confidence findings. ` +
  `Do not modify any files.\n`;

const reviewPrompt = (ref, focus) =>
  `You are a meticulous senior engineer giving an independent second opinion.\n` +
  planningContextInstruction +
  reviewRangeInstruction(ref) +
  untrackedInstruction +
  `Read related files as needed.\n` +
  `Pay special attention to missing tests, cancellation behavior, resume behavior, context limits, and failure modes.\n` +
  (focus ? `Focus especially on: ${focus}.\n` : "") +
  reviewOutputInstruction;

const adversarialPrompt = (ref, focus) =>
  `You are an adversarial reviewer.\n` +
  planningContextInstruction +
  reviewRangeInstruction(ref) +
  untrackedInstruction +
  `Pressure-test the change.\n` +
  `Challenge the design and approach, not just code details: assumptions, tradeoffs, ` +
  `failure modes, and whether a simpler/safer alternative exists.\n` +
  (focus ? `Focus especially on: ${focus}.\n` : "") +
  reviewOutputInstruction;

function setupReport(versionText) {
  const status = versionText ? `Claude Code is installed: ${versionText}\n` : "";
  return (
    status +
    `CLAUDE_BIN: ${claude.claudeBin}\n` +
    `CLAUDE_MODEL: ${claude.defaultModel}\n` +
    `CLAUDE_TIMEOUT_MS: ${claude.defaultTimeoutMs}\n` +
    `MCP client: set tool_timeout_sec to at least ${Math.ceil(claude.defaultTimeoutMs / 1000)}.\n` +
    skillInstallReport() +
    `Auth/reachability: run \`claude auth status\` if available, or run \`claude\` once interactively.\n` +
    `This setup check does not run a live review; live review reachability may still fail due to auth, timeout, malformed JSON, or context too large.`
  );
}

function skillInstallReport() {
  const skillRoot = path.join(os.homedir(), ".codex", "skills");
  const lines = ["Codex skills:"];
  for (const skill of expectedCodexSkills) {
    const target = path.join(skillRoot, skill, "SKILL.md");
    lines.push(`- ${skill}: ${fs.existsSync(target) ? "installed" : `missing (${target})`}`);
  }
  lines.push("Install missing skills: cp -R skills/* ~/.codex/skills/");
  return `${lines.join("\n")}\n`;
}

function repoReadConsentRequestText() {
  return (
    `${repoReadConsentNotice}\n` +
    "Choose one before launching Claude:\n" +
    '- allow once: pass `repo_read_consent: "allow_once"` for this request only.\n' +
    '- always allow for this repository: pass `repo_read_consent: "allow_repo"` to persist repo-level consent.\n' +
    '- cancel: pass `repo_read_consent: "cancel"` to stop without launching Claude.\n' +
    "No Claude process was started."
  );
}

function requireRepoReadConsent({ cwd, repo_read_consent }) {
  if (repo_read_consent === "cancel") {
    return {
      ok: false,
      text: `${repoReadConsentNotice}\nCancelled by user choice. No Claude process was started.`,
    };
  }
  if (claude.repoReadConsent(cwd)) return { ok: true };
  if (repo_read_consent === "allow_once") return { ok: true };
  if (repo_read_consent === "allow_repo") {
    claude.setRepoReadConsent(cwd);
    return { ok: true };
  }
  return {
    ok: false,
    text: repoReadConsentRequestText(),
  };
}

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
    const r = spawnSync(claude.claudeBin, ["--version"], { encoding: "utf8" });
    if (r.status === 0) {
      return {
        content: [
          {
            type: "text",
            text: setupReport(r.stdout.trim()),
          },
        ],
      };
    }
    return {
      content: [
        {
            type: "text",
            text:
            `Claude Code not found via "${claude.claudeBin}".\n` +
            `Install: npm i -g @anthropic-ai/claude-code, then run \`claude\` once to authenticate.\n` +
            `Or set CLAUDE_BIN to an absolute path in the MCP server env.\n\n` +
            setupReport(null),
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
      focus: z.string().optional().describe("Optional risk area to emphasize during review."),
      repo_read_consent: repoReadConsentSchema,
      background: z.boolean().optional(),
      cwd: z.string().optional(),
    },
  },
  async ({ base, focus, repo_read_consent, background, cwd }) => {
    const consent = requireRepoReadConsent({ cwd, repo_read_consent });
    if (!consent.ok) return { content: [{ type: "text", text: consent.text }], isError: false };
    const opts = {
      kind: "review",
      prompt: reviewPrompt(base, focus),
      model: claude.defaultModel,
      maxTurns: 25,
      allowWrite: false,
      cwd,
      background,
    };
    const r = background ? claude.startBackground(opts) : await claude.runForeground(opts);
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
      repo_read_consent: repoReadConsentSchema,
      background: z.boolean().optional(),
      cwd: z.string().optional(),
    },
  },
  async ({ base, focus, repo_read_consent, background, cwd }) => {
    const consent = requireRepoReadConsent({ cwd, repo_read_consent });
    if (!consent.ok) return { content: [{ type: "text", text: consent.text }], isError: false };
    const opts = {
      kind: "adversarial-review",
      prompt: adversarialPrompt(base, focus),
      model: claude.defaultModel,
      maxTurns: 25,
      allowWrite: false,
      cwd,
      background,
    };
    const r = background ? claude.startBackground(opts) : await claude.runForeground(opts);
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
      "repo-read consent is separate from allow_write and only permits Claude to read repo context. " +
      "allow_write=true is outside the standard v1 review path and lets Claude edit files. " +
      "It uses --dangerously-skip-permissions, grants broad write permissions, and should be used only in trusted repos.",
    inputSchema: {
      task: z.string().describe("What you want Claude to do."),
      model: z.string().optional(),
      resume: z
        .union([z.boolean(), z.string()])
        .optional()
        .describe('true = continue latest repo session; or a specific session id.'),
      fresh: z.boolean().optional().describe("Force a brand-new session (ignore resume)."),
      repo_read_consent: repoReadConsentSchema,
      allow_write: z.boolean().optional(),
      background: z.boolean().optional(),
      cwd: z.string().optional(),
    },
  },
  async ({ task, model, resume, fresh, repo_read_consent, allow_write, background, cwd }) => {
    const consent = requireRepoReadConsent({ cwd, repo_read_consent });
    if (!consent.ok) return { content: [{ type: "text", text: consent.text }], isError: false };
    let resumeId = null;
    if (!fresh && resume) resumeId = resume === true ? claude.lastSession(cwd) : resume;
    const opts = {
      kind: "rescue",
      prompt: task,
      model: model || claude.defaultModel,
      maxTurns: 40,
      allowWrite: !!allow_write,
      resume: resumeId,
      cwd,
      background,
    };
    const r = background ? claude.startBackground(opts) : await claude.runForeground(opts);
    return { content: [{ type: "text", text: r.text }], isError: !r.ok };
  }
);

server.registerTool(
  "claude_consent_status",
  {
    title: "Claude repo-read consent status",
    description: "Inspect repo-level Claude Code repo-read consent for this repository.",
    inputSchema: {
      cwd: z.string().optional(),
    },
  },
  async ({ cwd }) => {
    const consent = claude.repoReadConsent(cwd);
    const text = consent
      ? `Repo-read consent is allowed for this repository since ${consent.updatedAt}.\n${repoReadConsentNotice}`
      : `Repo-read consent is not set for this repository.\n${repoReadConsentNotice}`;
    return { content: [{ type: "text", text }], isError: false };
  }
);

server.registerTool(
  "claude_consent_revoke",
  {
    title: "Revoke Claude repo-read consent",
    description: "Revoke persisted repo-level Claude Code repo-read consent for this repository.",
    inputSchema: {
      cwd: z.string().optional(),
    },
  },
  async ({ cwd }) => {
    claude.clearRepoReadConsent(cwd);
    return {
      content: [
        {
          type: "text",
          text:
            "Revoked repo-read consent for this repository.\n" +
            "The next Claude review, adversarial review, or rescue request must choose allow once, always allow for this repository, or cancel.",
        },
      ],
      isError: false,
    };
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
    const r = claude.statusText({ taskId: task_id, cwd });
    return { content: [{ type: "text", text: r.text }], isError: r.isError };
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
    const r = claude.resultText({ taskId: task_id, cwd });
    return { content: [{ type: "text", text: r.text }], isError: r.isError };
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
    const r = claude.cancelJob({ taskId: task_id, cwd });
    return { content: [{ type: "text", text: r.text }], isError: r.isError };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
