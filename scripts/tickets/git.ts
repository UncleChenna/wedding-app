import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { LedgerData } from "./model";

export function run(cmd: string, args: string[], cwd: string, input?: string): string {
  return execFileSync(cmd, args, {
    cwd,
    encoding: "utf8",
    input,
    stdio: [input === undefined ? "ignore" : "pipe", "pipe", "pipe"],
  }).trim();
}
export const git = (args: string[], cwd: string, input?: string) => run("git", args, cwd, input);
export function tryGit(args: string[], cwd: string): string | null {
  try {
    return git(args, cwd);
  } catch {
    return null;
  }
}
export function stream(
  cmd: string,
  args: string[],
  cwd: string,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return (
    spawnSync(cmd, args, { cwd, env, stdio: "inherit", shell: process.platform === "win32" })
      .status === 0
  );
}

export type LedgerMode = "origin" | "local" | "off";
export const LEDGER_REF = "refs/heads/ticket-ledger";
const LOCAL_REF = "refs/harness/local-tickets";
const FILE = "ledger.json";

export function ledgerMode(): LedgerMode {
  const mode = process.env.TICKETS_LEDGER ?? "origin";
  if (mode !== "origin" && mode !== "local" && mode !== "off")
    throw new Error("TICKETS_LEDGER must be origin, local or off.");
  return mode;
}

export class LedgerUnavailableError extends Error {
  override name = "LedgerUnavailableError";
}

export interface LedgerSnapshot {
  sha: string | null;
  data: LedgerData;
}

const empty = (): LedgerData => ({ version: 1, lastId: 0, tickets: {} });

export function readLedger(cwd: string, mode: LedgerMode): LedgerSnapshot | null {
  if (mode === "off") return null;
  let sha: string | null = null;
  if (mode === "local") sha = tryGit(["rev-parse", "--verify", "--quiet", LOCAL_REF], cwd);
  else {
    if (!tryGit(["remote", "get-url", "origin"], cwd))
      throw new LedgerUnavailableError(
        "No origin remote: the shared ticket ledger is unavailable.",
      );
    let line: string;
    try {
      line = git(["ls-remote", "--heads", "origin", LEDGER_REF], cwd);
    } catch {
      throw new LedgerUnavailableError(
        "Cannot reach origin: the shared ticket ledger is unavailable.",
      );
    }
    if (line) {
      git(
        [
          "fetch",
          "--quiet",
          "origin",
          `${LEDGER_REF}:refs/remotes/origin/ticket-ledger`,
          "--force",
        ],
        cwd,
      );
      sha = git(["rev-parse", "refs/remotes/origin/ticket-ledger"], cwd);
    }
  }
  if (!sha) return { sha: null, data: empty() };
  return { sha, data: JSON.parse(git(["show", `${sha}:${FILE}`], cwd)) as LedgerData };
}

/** Compare-and-swap: the push fails if anyone else moved the ledger since `snapshot.sha`. */
function writeLedger(
  cwd: string,
  mode: LedgerMode,
  parent: string | null,
  data: LedgerData,
  message: string,
) {
  const temp = mkdtempSync(join(tmpdir(), "wedding-ledger-"));
  try {
    const env = { ...process.env, GIT_INDEX_FILE: join(temp, "index") };
    const blob = git(["hash-object", "-w", "--stdin"], cwd, JSON.stringify(data, null, 2) + "\n");
    execFileSync("git", ["update-index", "--add", "--cacheinfo", `100644,${blob},${FILE}`], {
      cwd,
      env,
    });
    const tree = execFileSync("git", ["write-tree"], { cwd, env, encoding: "utf8" }).trim();
    const commit = git(
      ["commit-tree", tree, ...(parent ? ["-p", parent] : []), "-m", message],
      cwd,
    );
    if (mode === "local")
      git(
        ["update-ref", LOCAL_REF, commit, parent ?? "0000000000000000000000000000000000000000"],
        cwd,
      );
    else
      git(
        [
          "push",
          "--quiet",
          `--force-with-lease=${LEDGER_REF}:${parent ?? ""}`,
          "origin",
          `${commit}:${LEDGER_REF}`,
        ],
        cwd,
      );
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
}

/** Serialise ledger edits within one clone; the remote lease serialises across clones. */
function withLock<T>(cwd: string, fn: () => T): T {
  const dir = join(
    git(["rev-parse", "--path-format=absolute", "--git-common-dir"], cwd),
    "harness-tickets.lock",
  );
  try {
    mkdirSync(dir);
  } catch {
    throw new Error(
      `Another ticket command holds ${dir}. If no ticket command is running, remove that directory.`,
    );
  }
  try {
    return fn();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * Apply `update` to fresh ledger state and publish it atomically. On a lost
 * race the update is re-run against the new state, so rules are re-checked.
 */
export function mutateLedger<T>(
  cwd: string,
  mode: LedgerMode,
  update: (data: LedgerData) => { result: T; message: string },
): T {
  if (mode === "off") throw new Error("mutateLedger called with ledger off");
  return withLock(cwd, () => {
    let lastError: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      const snapshot = readLedger(cwd, mode);
      if (!snapshot) throw new Error("ledger unavailable");
      const data = structuredClone(snapshot.data);
      const { result, message } = update(data);
      try {
        writeLedger(cwd, mode, snapshot.sha, data, message);
        return result;
      } catch (error) {
        lastError = error;
      }
    }
    throw new Error(`Could not update the ticket ledger after 3 attempts: ${String(lastError)}`);
  });
}
