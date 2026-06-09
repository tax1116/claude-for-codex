import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export const DEFAULT_STATE_ROOT = path.join(os.homedir(), ".claude-for-codex", "state");
export const DEFAULT_LEGACY_JOBS_ROOT = path.join(os.homedir(), ".claude-for-codex", "jobs");

export function repoRoot(cwd = process.cwd()) {
  const result = spawnSync("git", ["rev-parse", "--show-toplevel"], {
    cwd,
    encoding: "utf8",
  });
  if (result.status === 0) return result.stdout.trim();
  return path.resolve(cwd);
}

export function legacyRepoKey(cwd = process.cwd()) {
  return createHash("sha1").update(repoRoot(cwd)).digest("hex").slice(0, 12);
}

export function resolveStateRoot(env = process.env) {
  return env.CLAUDE_FOR_CODEX_STATE || DEFAULT_STATE_ROOT;
}

export function resolveLegacyRoots(env = process.env) {
  return uniquePaths([env.CLAUDE_FOR_CODEX_STORE, env.CODEX_CC_STORE, DEFAULT_LEGACY_JOBS_ROOT].filter(Boolean));
}

function uniquePaths(paths) {
  return [...new Set(paths.map((p) => path.resolve(p)))];
}

function repoSlug(root) {
  return path.basename(root).replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "repo";
}

function repoRealpathHash(root) {
  const real = fs.realpathSync.native(root);
  return createHash("sha1").update(real).digest("hex").slice(0, 12);
}

function inferJobClass(kind) {
  if (kind === "review" || kind === "adversarial-review") return "review";
  if (kind === "followup") return "followup";
  return "task";
}

function normalizeStatus(status) {
  return status === "done" ? "completed" : status;
}

function isCompletedReviewJob(job) {
  if (!job) return false;
  const jobClass = job.jobClass || inferJobClass(job.kind);
  const status = normalizeStatus(job.status);
  const hasReviewKind = job.kind === "review" || job.kind === "adversarial-review";
  return jobClass === "review" && hasReviewKind && status === "completed" && !!(job.result || job.rendered);
}

function parseJsonFile(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

export class StateStore {
  constructor({ cwd = process.cwd(), stateRoot = resolveStateRoot(), legacyRoots = resolveLegacyRoots() } = {}) {
    this.cwd = cwd;
    this.workspaceRoot = repoRoot(cwd);
    this.stateRoot = path.resolve(stateRoot);
    this.legacyRoots = uniquePaths(legacyRoots).filter((root) => root !== this.stateRoot);
    this.repoStateDir = path.join(this.stateRoot, `${repoSlug(this.workspaceRoot)}-${repoRealpathHash(this.workspaceRoot)}`);
    this.jobsDir = path.join(this.repoStateDir, "jobs");
    this.logsDir = path.join(this.repoStateDir, "logs");
    this.statePath = path.join(this.repoStateDir, "state.json");
  }

  jobPath(id) {
    return path.join(this.jobsDir, `${id}.json`);
  }

  writeJob(job) {
    this.#ensureState();
    const normalized = this.#normalizeJob(job);
    fs.writeFileSync(this.jobPath(normalized.id), JSON.stringify(normalized, null, 2));
    this.#upsertJobSummary(normalized);
    return normalized;
  }

  readJob(id) {
    const canonical = parseJsonFile(this.jobPath(id));
    if (canonical) return this.#normalizeJob(canonical);

    for (const dir of this.#legacyJobDirs()) {
      const legacy = parseJsonFile(path.join(dir, `${id}.json`));
      if (legacy) return this.#normalizeJob(legacy);
    }
    return null;
  }

  listJobs() {
    const jobs = new Map();
    for (const job of this.#readJobsFromDir(this.jobsDir)) jobs.set(job.id, job);
    for (const dir of this.#legacyJobDirs()) {
      for (const job of this.#readJobsFromDir(dir)) {
        if (!jobs.has(job.id)) jobs.set(job.id, job);
      }
    }
    return [...jobs.values()].sort((a, b) => (b.startedAt || 0) - (a.startedAt || 0));
  }

  latestCompletedReview() {
    return this.listJobs().find((job) => isCompletedReviewJob(job)) || null;
  }

  rememberSession(sessionId) {
    if (!sessionId) return;
    this.#ensureState();
    fs.writeFileSync(path.join(this.repoStateDir, "last-session.txt"), sessionId);
  }

  lastSession() {
    try {
      return fs.readFileSync(path.join(this.repoStateDir, "last-session.txt"), "utf8").trim() || null;
    } catch {
      return null;
    }
  }

  #ensureState() {
    fs.mkdirSync(this.jobsDir, { recursive: true });
    fs.mkdirSync(this.logsDir, { recursive: true });
    if (!fs.existsSync(this.statePath)) {
      fs.writeFileSync(
        this.statePath,
        JSON.stringify(
          {
            version: 1,
            config: {
              stopReviewGate: false,
              deepReview: {
                commands: [],
              },
            },
            jobs: [],
          },
          null,
          2
        )
      );
    }
  }

  #normalizeJob(job) {
    return {
      ...job,
      jobClass: job.jobClass || inferJobClass(job.kind),
      status: normalizeStatus(job.status),
      cwd: job.cwd || this.cwd,
      workspaceRoot: job.workspaceRoot || this.workspaceRoot,
    };
  }

  #upsertJobSummary(job) {
    const state = parseJsonFile(this.statePath) || { version: 1, config: {}, jobs: [] };
    const summary = {
      id: job.id,
      jobClass: job.jobClass,
      kind: job.kind,
      status: job.status,
      startedAt: job.startedAt,
      endedAt: job.endedAt,
    };
    state.jobs = [summary, ...(state.jobs || []).filter((existing) => existing.id !== job.id)]
      .sort((a, b) => (b.startedAt || 0) - (a.startedAt || 0))
      .slice(0, 100);
    fs.writeFileSync(this.statePath, JSON.stringify(state, null, 2));
  }

  #legacyJobDirs() {
    const key = legacyRepoKey(this.workspaceRoot);
    return this.legacyRoots.map((root) => path.join(root, key));
  }

  #readJobsFromDir(dir) {
    try {
      return fs
        .readdirSync(dir)
        .filter((file) => file.endsWith(".json"))
        .map((file) => parseJsonFile(path.join(dir, file)))
        .filter((job) => job?.id)
        .map((job) => this.#normalizeJob(job));
    } catch {
      return [];
    }
  }
}
