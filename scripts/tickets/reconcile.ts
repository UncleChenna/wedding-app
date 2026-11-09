import { z } from "zod";
import { criteria, parseTicket } from "./format";
import { run, tryGit } from "./git";
import { REVIEW_BASE } from "./review";
import type { Frontmatter, Status } from "./model";
import { TransitionError } from "./workflow";

const oid = z.string().regex(/^[a-f0-9]{40,64}$/i);
const prSchema = z.object({
  url: z.string().url(),
  state: z.literal("MERGED"),
  baseRefName: z.literal(REVIEW_BASE),
  headRefOid: oid,
  mergeCommit: z.object({ oid }),
});
const runSchema = z.object({
  databaseId: z.number().int().positive(),
  headSha: oid,
  status: z.literal("completed"),
  conclusion: z.literal("success"),
  event: z.literal("pull_request"),
  url: z.string().url(),
  jobs: z.array(
    z.object({
      name: z.string(),
      status: z.literal("completed"),
      conclusion: z.literal("success"),
    }),
  ),
});
const requiredJobs = [
  "tickets valid",
  "no AI attribution in PR text",
  "pnpm verify",
  "migrations + seed",
  "invitation journey (mobile + desktop)",
];

/** Optional review success cannot stand in for the repository's full CI workflow. */
export function verifyRepairRun(value: unknown, expectedHead: string): string {
  const checked = runSchema.parse(value);
  if (
    checked.headSha !== expectedHead ||
    requiredJobs.some((name) => !checked.jobs.some((job) => job.name === name))
  )
    throw new TransitionError("Repair CI must pass every required job on its exact merged head.");
  return checked.url;
}

export function reconciliationEligibility(
  meta: Frontmatter,
  actor: string,
  statusOf: (id: string) => Status | undefined,
): void {
  if (!meta.owner || meta.owner !== actor)
    throw new TransitionError("Only the ticket owner can reconcile it.");
  if (!["blocked", "in_progress"].includes(meta.status))
    throw new TransitionError(
      "Reconciliation only recovers blocked or in-progress merged tickets.",
    );
  const pending = meta.blocked_by.filter((id) => statusOf(id) !== "done");
  if (pending.length) throw new TransitionError(`Reconciliation waits for ${pending.join(", ")}.`);
  if (!meta.pr)
    throw new TransitionError("The original merged PR must already be recorded on the ticket.");
}

interface Dependencies {
  git: typeof tryGit;
  gh: (args: string[], cwd: string) => unknown;
}
const defaults: Dependencies = {
  git: tryGit,
  gh: (args, cwd) => JSON.parse(run("gh", args, cwd)) as unknown,
};

/** Fresh immutable Git history and GitHub CI evidence; no local files or environment certify success. */
export function reconciliationEvidence(
  cwd: string,
  originalRef: string,
  repairNumber: string,
  ticketPath: string,
  dependencies: Dependencies = defaults,
): { original: string; repair: string; head: string; develop: string; run: string } {
  if (!/^[1-9]\d*$/.test(repairNumber))
    throw new TransitionError("--repair-pr must be a repository PR number.");
  const fields = "url,state,baseRefName,headRefOid,mergeCommit";
  const readPr = (ref: string) =>
    prSchema.parse(dependencies.gh(["pr", "view", ref, "--json", fields], cwd));
  const original = readPr(originalRef);
  const repair = readPr(repairNumber);
  if (original.url.split("/pull/")[0] !== repair.url.split("/pull/")[0])
    throw new TransitionError("Original and repair PRs must belong to the same repository.");
  if (original.url === repair.url)
    throw new TransitionError("A separate verified repair PR is required.");
  const git = (args: string[]) => dependencies.git(args, cwd);
  if (git(["fetch", "--quiet", "origin", `refs/heads/${REVIEW_BASE}`]) === null)
    throw new TransitionError("Cannot fetch fresh develop evidence.");
  const develop = oid.parse(git(["rev-parse", "--verify", "FETCH_HEAD^{commit}"]));
  for (const [ancestor, descendant] of [
    [original.mergeCommit.oid, repair.headRefOid],
    [repair.headRefOid, repair.mergeCommit.oid],
    [repair.mergeCommit.oid, develop],
    [original.mergeCommit.oid, develop],
  ]) {
    if (
      !ancestor ||
      !descendant ||
      git(["merge-base", "--is-ancestor", ancestor, descendant]) === null
    )
      throw new TransitionError(
        "Repair must contain the original merge and both must be reachable from fresh develop.",
      );
  }
  // Criteria must already be complete in the tested repair, not added later on develop.
  for (const commit of [repair.headRefOid, develop]) {
    const text = git(["show", `${commit}:${ticketPath}`]);
    const checked = text ? criteria(parseTicket(text, ticketPath)) : [];
    if (!checked.length || checked.some((criterion) => !criterion.checked))
      throw new TransitionError(
        "The tested repair and current develop must contain completed original acceptance criteria.",
      );
  }
  const runs = z
    .array(z.object({ databaseId: z.number().int().positive() }))
    .parse(
      dependencies.gh(
        [
          "run",
          "list",
          "--workflow",
          "ci.yml",
          "--commit",
          repair.headRefOid,
          "--event",
          "pull_request",
          "--limit",
          "1",
          "--json",
          "databaseId",
        ],
        cwd,
      ),
    );
  const latest = runs[0];
  if (!latest) throw new TransitionError("No CI workflow run exists for the repair head.");
  const evidence = dependencies.gh(
    [
      "run",
      "view",
      String(latest.databaseId),
      "--json",
      "databaseId,headSha,status,conclusion,event,url,jobs",
    ],
    cwd,
  );
  const runUrl = verifyRepairRun(evidence, repair.headRefOid);
  if (runSchema.parse(evidence).databaseId !== latest.databaseId)
    throw new TransitionError("CI run identity changed while reading evidence.");
  // Fail if metadata changes during the evidence read; never combine two heads.
  const again = readPr(repairNumber);
  if (
    again.headRefOid !== repair.headRefOid ||
    again.mergeCommit.oid !== repair.mergeCommit.oid ||
    again.url !== repair.url
  )
    throw new TransitionError(
      "Repair PR changed while checking evidence; retry with fresh evidence.",
    );
  const currentRuns = z
    .array(z.object({ databaseId: z.number().int().positive() }))
    .parse(
      dependencies.gh(
        [
          "run",
          "list",
          "--workflow",
          "ci.yml",
          "--commit",
          repair.headRefOid,
          "--event",
          "pull_request",
          "--limit",
          "1",
          "--json",
          "databaseId",
        ],
        cwd,
      ),
    );
  if (currentRuns[0]?.databaseId !== latest.databaseId)
    throw new TransitionError("A newer repair CI run appeared; wait for its completed result.");
  // A GitHub rerun can retain the run ID while becoming pending again.
  const finalRun = dependencies.gh(
    [
      "run",
      "view",
      String(latest.databaseId),
      "--json",
      "databaseId,headSha,status,conclusion,event,url,jobs",
    ],
    cwd,
  );
  if (
    verifyRepairRun(finalRun, repair.headRefOid) !== runUrl ||
    runSchema.parse(finalRun).databaseId !== latest.databaseId
  )
    throw new TransitionError("Repair CI evidence changed during reconciliation.");
  return {
    original: original.url,
    repair: repair.url,
    head: repair.headRefOid,
    develop,
    run: runUrl,
  };
}
