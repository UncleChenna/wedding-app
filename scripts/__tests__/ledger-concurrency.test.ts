import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { afterEach, expect, it } from "vitest";

import { isolatedGitEnv } from "./git-env";

const roots: string[] = [];
const env = isolatedGitEnv();
const source = resolve("scripts/tickets/git.ts");
const tsx = resolve("node_modules/tsx/dist/loader.mjs");
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});
function fixture() {
  const root = mkdtempSync(join(tmpdir(), "ledger-concurrency-"));
  roots.push(root);
  const cwd = join(root, "checkout");
  const git = (args: string[]) =>
    execFileSync("git", args, {
      cwd,
      env,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  execFileSync("git", ["init", "--quiet", cwd], { env });
  git(["config", "user.name", "Ledger Test"]);
  git(["config", "user.email", "ledger@example.invalid"]);
  git(["config", "core.hooksPath", "/dev/null"]);
  git(["commit", "--quiet", "--allow-empty", "-m", "fixture"]);
  const remote = join(root, "remote.git");
  execFileSync("git", ["init", "--bare", "--quiet", remote], { env });
  git(["remote", "add", "origin", remote]);
  const script = (body: string) => {
    const path = join(root, `worker-${Math.random()}.mts`);
    writeFileSync(path, `import * as ledger from ${JSON.stringify(source)};\n${body}`);
    return path;
  };
  const run = (body: string, directory = cwd) =>
    execFileSync(process.execPath, ["--import", tsx, script(body)], {
      cwd: directory,
      env,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  const start = (body: string, directory = cwd) => {
    const child = spawn(process.execPath, ["--import", tsx, script(body)], {
      cwd: directory,
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    return new Promise<string>((accept, reject) => {
      let output = "";
      let error = "";
      child.stdout.on("data", (chunk) => {
        output += String(chunk);
      });
      child.stderr.on("data", (chunk) => {
        error += String(chunk);
      });
      child.on("error", reject);
      child.on("exit", (code) => (code === 0 ? accept(output.trim()) : reject(new Error(error))));
    });
  };
  run(
    `ledger.mutateLedger(process.cwd(), "local", data => { data.lastId=1; return {result:null,message:"seed"}; });`,
  );
  git(["push", "--quiet", "origin", "refs/harness/local-tickets:refs/heads/ticket-ledger"]);
  return { root, cwd, git, run, start };
}

it("reads immutable origin snapshots without modifying FETCH_HEAD or remote tracking refs", async () => {
  const f = fixture();
  const original = f.git(["rev-parse", "HEAD"]);
  f.git(["update-ref", "refs/remotes/origin/ticket-ledger", original]);
  const fetchHead = join(f.cwd, ".git/FETCH_HEAD");
  writeFileSync(fetchHead, "sentinel\n");
  const reader = `console.log(JSON.stringify(ledger.readLedger(process.cwd(), "origin")));`;
  const snapshots = await Promise.allSettled(Array.from({ length: 4 }, () => f.start(reader)));
  for (const snapshot of snapshots) {
    expect(snapshot.status).toBe("fulfilled");
    if (snapshot.status === "fulfilled") expect(JSON.parse(snapshot.value).data.lastId).toBe(1);
  }
  expect(f.git(["rev-parse", "refs/remotes/origin/ticket-ledger"])).toBe(original);
  expect(readFileSync(fetchHead, "utf8")).toBe("sentinel\n");
});

it("serializes concurrent linked-worktree writes without losing updates", async () => {
  const f = fixture();
  const other = join(f.root, "other");
  f.git(["worktree", "add", "--quiet", "--detach", other]);
  const writer = `ledger.mutateLedger(process.cwd(), "origin", data => { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,150); data.lastId++; return {result:null,message:"increment"}; });`;
  const writes = await Promise.allSettled([f.start(writer), f.start(writer, other)]);
  expect(writes.map((write) => write.status)).toEqual(["fulfilled", "fulfilled"]);
  expect(f.run(`console.log(ledger.readLedger(process.cwd(), "origin")?.data.lastId);`)).toBe("3");
  expect(existsSync(join(f.cwd, ".git/harness-tickets.lock"))).toBe(false);
});

it("times out without deleting another writer's lock and surfaces non-contention errors", () => {
  const f = fixture();
  const lock = join(f.cwd, ".git/harness-tickets.lock");
  const result = f.run(`import {mkdirSync,writeFileSync,existsSync,rmSync} from "node:fs";
    const lock=${JSON.stringify(lock)};
    mkdirSync(lock); writeFileSync(lock+"/owner", "other");
    try { ledger.withLedgerLock(process.cwd(), () => { throw new Error("must not run"); }, 40); } catch(error) { console.log(error.message); }
    console.log(existsSync(lock+"/owner"));
    rmSync(lock,{recursive:true}); writeFileSync(lock,"not a lock directory");
    try { ledger.withLedgerLock(process.cwd(), () => {}, 40); } catch(error) { console.log(error.message); }
    console.log(existsSync(lock));`);
  expect(result).toContain("Timed out waiting");
  expect(result).toContain("not a directory");
  expect(result.match(/true/g)).toHaveLength(2);
});

it("releases only its acquired lock when an update fails without publishing changes", () => {
  const f = fixture();
  const result = f.run(`
    try { ledger.mutateLedger(process.cwd(), "origin", data => { data.lastId=99; throw new Error("rejected ownership"); }); }
    catch(error) { console.log(error.message); }
    console.log(ledger.readLedger(process.cwd(), "origin")?.data.lastId);`);
  expect(result).toBe("rejected ownership\n1");
  expect(existsSync(join(f.cwd, ".git/harness-tickets.lock"))).toBe(false);
});

it("fails closed when origin cannot supply the snapshot", () => {
  const f = fixture();
  f.git(["remote", "set-url", "origin", join(f.root, "missing.git")]);
  expect(
    f.run(
      `try { ledger.readLedger(process.cwd(), "origin"); } catch(error) { console.log(error.name); }`,
    ),
  ).toBe("LedgerUnavailableError");
});

it("rejects a stale remote lease without overwriting the newer ledger", () => {
  const f = fixture();
  const stale = f.git(["rev-parse", "refs/harness/local-tickets"]);
  f.run(
    `ledger.mutateLedger(process.cwd(), "origin", data => { data.lastId=2; return {result:null,message:"newer"}; });`,
  );
  expect(() =>
    f.git([
      "push",
      "--quiet",
      `--force-with-lease=refs/heads/ticket-ledger:${stale}`,
      "origin",
      `${stale}:refs/heads/ticket-ledger`,
    ]),
  ).toThrow();
  expect(f.run(`console.log(ledger.readLedger(process.cwd(), "origin")?.data.lastId);`)).toBe("2");
});
