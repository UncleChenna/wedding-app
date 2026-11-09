import { git } from "./io.mjs";

/** The files that make up the ticket and worktree tooling (TICKET-218). */
export const HARNESS_PATHS = [
  "scripts/tickets.ts",
  "scripts/tickets",
  "scripts/worktree.mjs",
  "scripts/worktree.sh",
  "scripts/db-local.mjs",
  "scripts/db-ensure.mjs",
  "scripts/harness",
  "package.json",
];

/**
 * Commits on the last-fetched `origin/develop` that change the harness but aren't in this
 * checkout. A main checkout left on an old branch silently runs old `t:*`/`wt:*` code, which is
 * how new worktrees came up without the Supabase auth template on 2026-11-06. No fetch is made,
 * so the check is instant and works offline.
 */
export function staleHarnessCommits(cwd) {
  try {
    git(["rev-parse", "--verify", "--quiet", "refs/remotes/origin/develop"], cwd);
  } catch {
    return [];
  }
  try {
    const log = git(["log", "--format=%h %s", "HEAD..origin/develop", "--", ...HARNESS_PATHS], cwd);
    return log ? log.split("\n") : [];
  } catch {
    return [];
  }
}

export function staleHarnessMessage(commits) {
  if (!commits.length) return null;
  return (
    `Note: this checkout's ticket and worktree tools are ${commits.length} commit(s) behind origin/develop ` +
    `(latest: ${commits[0]}). Run them from an up-to-date checkout, e.g. git switch develop && git pull, ` +
    `or the new worktree's own copy.`
  );
}

/** Prints the warning to stderr; never blocks the command. */
export function warnIfStaleHarness(cwd) {
  if (process.env.HARNESS_SKIP_STALE_CHECK === "1") return;
  const message = staleHarnessMessage(staleHarnessCommits(cwd));
  if (message) console.error(message);
}
