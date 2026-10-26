import { tryGit } from "./git";
import { REVIEW_BASE } from "./review";

export interface ReviewPr {
  url: string;
  state: string;
  baseRefName: string;
  mergeCommit: { oid: string } | null;
}

/** Completion is based on fresh integrated history, including historical stacked PRs. */
export function mergedReviewEvidence(
  cwd: string,
  pr: ReviewPr | null,
  ticketPath: string,
  runGit: typeof tryGit = tryGit,
): { url: string; ticketText: string; developCommit: string } | null {
  const mergeOid = pr?.mergeCommit?.oid;
  if (pr?.state !== "MERGED" || !mergeOid || !/^[a-f0-9]{40,64}$/i.test(mergeOid)) return null;
  if (runGit(["fetch", "--quiet", "origin", `refs/heads/${REVIEW_BASE}`], cwd) === null) return null;
  // Resolve once: ancestry and criteria must refer to the same fetched snapshot.
  const developCommit = runGit(["rev-parse", "--verify", "FETCH_HEAD^{commit}"], cwd);
  if (!developCommit || !/^[a-f0-9]{40,64}$/i.test(developCommit)) return null;
  if (runGit(["merge-base", "--is-ancestor", mergeOid, developCommit], cwd) === null) return null;
  const ticketText = runGit(["show", `${developCommit}:${ticketPath}`], cwd);
  if (!ticketText) return null;
  return { url: pr.url, ticketText, developCommit };
}
