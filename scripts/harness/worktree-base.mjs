import { git } from "./io.mjs";

/** Existing branches retain history; new branches start at freshly fetched develop. */
export function worktreeBase(cwd, branch) {
  let existingBranch = false;
  try {
    git(["show-ref", "--verify", `refs/heads/${branch}`], cwd);
    existingBranch = true;
  } catch {
    // A missing branch is expected for a new ticket.
  }
  if (existingBranch) return { existingBranch, baseCommit: git(["rev-parse", branch], cwd) };
  git(["fetch", "origin", "develop"], cwd);
  return { existingBranch, baseCommit: git(["rev-parse", "refs/remotes/origin/develop"], cwd) };
}
