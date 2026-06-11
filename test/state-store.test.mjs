import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { StateStore, legacyRepoKey } from "../src/state-store.mjs";

function makeTempRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "claude-for-codex-state-"));
  const git = spawnSync("git", ["init", "--quiet"], { cwd: dir });
  assert.equal(git.status, 0, git.stderr.toString());
  return dir;
}

function makeStore(cwd) {
  const stateRoot = fs.mkdtempSync(path.join(os.tmpdir(), "claude-for-codex-state-root-"));
  return {
    stateRoot,
    store: new StateStore({ cwd, stateRoot }),
  };
}

test("writes jobs under the canonical repo state directory", () => {
  const cwd = makeTempRepo();
  const { stateRoot, store } = makeStore(cwd);

  store.writeJob({
    id: "task-review",
    jobClass: "review",
    kind: "review",
    status: "completed",
    cwd,
    startedAt: 10,
    result: "Looks good.",
  });

  const job = store.readJob("task-review");

  assert.equal(job.id, "task-review");
  assert.equal(job.workspaceRoot, store.workspaceRoot);
  assert.equal(job.status, "completed");
  assert.equal(path.dirname(path.dirname(store.jobPath("task-review"))), store.repoStateDir);
  assert.equal(path.dirname(store.repoStateDir), stateRoot);
  assert.ok(fs.existsSync(path.join(store.repoStateDir, "state.json")));
});

test("returns the latest completed review job and ignores non-review jobs", () => {
  const cwd = makeTempRepo();
  const { store } = makeStore(cwd);

  store.writeJob({
    id: "task-old-review",
    jobClass: "review",
    kind: "review",
    status: "completed",
    cwd,
    startedAt: 10,
    result: "old",
  });
  store.writeJob({
    id: "task-running-review",
    jobClass: "review",
    kind: "review",
    status: "running",
    cwd,
    startedAt: 40,
    result: "",
  });
  store.writeJob({
    id: "task-followup",
    jobClass: "followup",
    kind: "followup",
    status: "completed",
    cwd,
    startedAt: 50,
    result: "followup",
  });
  store.writeJob({
    id: "task-new-review",
    jobClass: "review",
    kind: "adversarial-review",
    status: "completed",
    cwd,
    startedAt: 30,
    result: "new",
  });

  assert.equal(store.latestCompletedReview()?.id, "task-new-review");
});

test("reads legacy job files while writing new jobs to the canonical state root", () => {
  const cwd = makeTempRepo();
  const stateRoot = fs.mkdtempSync(path.join(os.tmpdir(), "claude-for-codex-state-root-"));
  const legacyRoot = fs.mkdtempSync(path.join(os.tmpdir(), "claude-for-codex-legacy-root-"));
  const legacyDir = path.join(legacyRoot, legacyRepoKey(cwd));
  fs.mkdirSync(legacyDir, { recursive: true });
  fs.writeFileSync(
    path.join(legacyDir, "task-legacy.json"),
    JSON.stringify(
      {
        id: "task-legacy",
        kind: "review",
        status: "done",
        cwd,
        startedAt: 20,
        result: "legacy review",
      },
      null,
      2
    )
  );

  const store = new StateStore({ cwd, stateRoot, legacyRoots: [legacyRoot] });
  store.writeJob({
    id: "task-new",
    jobClass: "review",
    kind: "review",
    status: "completed",
    cwd,
    startedAt: 10,
    result: "new review",
  });

  assert.equal(store.readJob("task-legacy")?.result, "legacy review");
  assert.equal(store.latestCompletedReview()?.id, "task-legacy");
  assert.ok(fs.existsSync(path.join(store.repoStateDir, "jobs", "task-new.json")));
  assert.equal(fs.existsSync(path.join(legacyDir, "task-new.json")), false);
});

test("persists and revokes repo-read consent in repo state", () => {
  const cwd = makeTempRepo();
  const { stateRoot, store } = makeStore(cwd);

  assert.equal(store.repoReadConsent(), null);

  const consent = store.setRepoReadConsent({ updatedAt: "2026-06-11T00:00:00.000Z" });
  assert.deepEqual(consent, {
    allowed: true,
    updatedAt: "2026-06-11T00:00:00.000Z",
  });

  const freshStore = new StateStore({ cwd, stateRoot });
  assert.deepEqual(freshStore.repoReadConsent(), consent);

  const state = JSON.parse(fs.readFileSync(path.join(store.repoStateDir, "state.json"), "utf8"));
  assert.deepEqual(state.config.repoReadConsent, consent);

  freshStore.clearRepoReadConsent();
  assert.equal(freshStore.repoReadConsent(), null);
});
