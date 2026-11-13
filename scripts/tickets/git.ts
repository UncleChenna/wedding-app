import { execFileSync, spawnSync } from "node:child_process";
import { chmodSync, lstatSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
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

export interface LedgerWriteOptions {
  /** Per preparation command, not the whole transaction; callers may only lower it. */
  preparationTimeoutMs?: number;
}

const PREPARATION_TIMEOUT_MS = 30_000;

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
      const advertised = line.split(/\s+/)[0];
      if (!advertised || !/^[0-9a-f]{40,64}$/.test(advertised))
        throw new LedgerUnavailableError("Origin returned an invalid ledger commit.");
      try {
        // Linked worktrees share refs and FETCH_HEAD. Fetch the immutable object
        // without a destination ref, configured ref mapping, tags or FETCH_HEAD.
        git(
          [
            "fetch",
            "--quiet",
            "--no-write-fetch-head",
            "--no-tags",
            "--refmap=",
            "origin",
            advertised,
          ],
          cwd,
        );
      } catch {
        throw new LedgerUnavailableError("Cannot fetch the advertised ticket ledger commit.");
      }
      sha = advertised;
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
  preparationTimeoutMs: number,
) {
  const temp = mkdtempSync(join(tmpdir(), "wedding-ledger-"));
  try {
    chmodSync(temp, 0o700);
    const env = { ...process.env, GIT_INDEX_FILE: join(temp, "index") };
    const input = join(temp, FILE);
    writeFileSync(input, JSON.stringify(data, null, 2) + "\n", { mode: 0o600, flag: "wx" });
    const prepare = (args: string[], childEnv = process.env) =>
      execFileSync("git", args, {
        cwd,
        env: childEnv,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
        timeout: preparationTimeoutMs,
        // Only unpublished object/index preparation runs here. Killing this
        // owned child cannot change a ref, and cannot leave the input pipe open.
        killSignal: "SIGKILL",
      }).trim();
    const blob = prepare(["hash-object", "-w", "--no-filters", "--", input]);
    prepare(["update-index", "--add", "--cacheinfo", `100644,${blob},${FILE}`], env);
    const tree = prepare(["write-tree"], env);
    const commit = prepare(
      ["commit-tree", tree, ...(parent ? ["-p", parent] : []), "-m", message],
    );
    // Keep publication semantics unchanged: a timeout after a remote accepts a
    // push would make its acknowledgement ambiguous and could repeat an update.
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
export function withLedgerLock<T>(cwd: string, fn: () => T, timeoutMs = 30_000): T {
  const dir = join(
    git(["rev-parse", "--path-format=absolute", "--git-common-dir"], cwd),
    "harness-tickets.lock",
  );
  const deadline = performance.now() + timeoutMs;
  const sleeper = new Int32Array(new SharedArrayBuffer(4));
  for (;;) {
    if (performance.now() >= deadline)
      throw new Error(
        `Timed out waiting for another ticket command holding ${dir}. Retry when it finishes; the existing lock was preserved.`,
      );
    try {
      mkdirSync(dir);
      break;
    } catch (error) {
      if (!(error instanceof Error) || !("code" in error) || error.code !== "EEXIST") throw error;
      try {
        if (!lstatSync(dir).isDirectory())
          throw new Error(`Ticket lock is not a directory: ${dir}`);
      } catch (inspectionError) {
        // Its owner may have released it between mkdir and inspection.
        if (
          inspectionError instanceof Error &&
          "code" in inspectionError &&
          inspectionError.code === "ENOENT"
        )
          continue;
        throw inspectionError;
      }
      const remaining = deadline - performance.now();
      if (remaining <= 0)
        throw new Error(
          `Timed out waiting for another ticket command holding ${dir}. Retry when it finishes; the existing lock was preserved.`,
        );
      Atomics.wait(sleeper, 0, 0, Math.min(100, remaining));
    }
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
  options: LedgerWriteOptions = {},
): T {
  if (mode === "off") throw new Error("mutateLedger called with ledger off");
  const preparationTimeoutMs = options.preparationTimeoutMs ?? PREPARATION_TIMEOUT_MS;
  if (
    !Number.isSafeInteger(preparationTimeoutMs) ||
    preparationTimeoutMs <= 0 ||
    preparationTimeoutMs > PREPARATION_TIMEOUT_MS
  )
    throw new RangeError(
      `Ledger preparation timeout must be an integer from 1 to ${PREPARATION_TIMEOUT_MS}ms.`,
    );
  return withLedgerLock(cwd, () => {
    let lastError: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      const snapshot = readLedger(cwd, mode);
      if (!snapshot) throw new Error("ledger unavailable");
      const data = structuredClone(snapshot.data);
      const { result, message } = update(data);
      try {
        writeLedger(cwd, mode, snapshot.sha, data, message, preparationTimeoutMs);
        return result;
      } catch (error) {
        lastError = error;
      }
    }
    throw new Error(`Could not update the ticket ledger after 3 attempts: ${String(lastError)}`);
  });
}
