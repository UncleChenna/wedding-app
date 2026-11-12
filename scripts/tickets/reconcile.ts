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
  baseRefName: z.string().min(1),
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
export function verifyRepairRun(value: unknown, expectedHead: string, historical = false): string {
  const checked = runSchema.parse(value);
  // Scoped CI is not full repair provenance. Its dedicated proof job only runs
  // after every original suite succeeds; skipped jobs still fail runSchema above.
  const scopedWorkflow = checked.jobs.some((job) => job.name === "verification scope");
  const expectedJobs = scopedWorkflow
    ? ["verification scope", "required CI gates", "full verification proof",
        "no AI attribution in PR text",
       "tickets valid", "pnpm verify", "migrations + seed",
       "invitation journey (mobile + desktop)", "admin journey (mobile + desktop)",
       "camera QR pixels (Chromium + WebKit)"]
    : historical ? requiredJobs.slice(0, 4) : requiredJobs;
  if (
    checked.headSha !== expectedHead ||
    expectedJobs.some(
      (name) => !checked.jobs.some((job) => job.name === name),
    )
  )
    throw new TransitionError("Repair CI must pass every required job on its exact merged head.");
  return checked.url;
}

export function reconciliationEligibility(
  meta: Frontmatter,
  actor: string,
  statusOf: (id: string) => Status | undefined,
  historical = false,
): void {
  if (!meta.owner || meta.owner !== actor)
    throw new TransitionError("Only the ticket owner can reconcile it.");
  if (!(historical ? ["in_review"] : ["blocked", "in_progress"]).includes(meta.status))
    throw new TransitionError(
      historical
        ? "Historical reconciliation only recovers in-review stacked tickets."
        : "Reconciliation only recovers blocked or in-progress merged tickets.",
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
  historical = false,
  suppliedSource?: string,
) {
  if (suppliedSource !== undefined && !historical)
    throw new TransitionError("--source-commit requires --integration-pr historical recovery.");
  const source = suppliedSource === undefined ? undefined : oid.parse(suppliedSource);
  if (!/^[1-9]\d*$/.test(repairNumber))
    throw new TransitionError("--repair-pr must be a repository PR number.");
  const fields = "url,state,baseRefName,headRefOid,mergeCommit";
  const readPr = (ref: string) =>
    prSchema.parse(dependencies.gh(["pr", "view", ref, "--json", fields], cwd));
  const original = readPr(originalRef);
  const repair = readPr(repairNumber);
  if (
    repair.baseRefName !== REVIEW_BASE ||
    (historical ? original.baseRefName === REVIEW_BASE : original.baseRefName !== REVIEW_BASE)
  )
    throw new TransitionError(
      "Recovery requires a develop integration and the expected original PR base.",
    );
  if (original.url.split("/pull/")[0] !== repair.url.split("/pull/")[0])
    throw new TransitionError("Original and repair PRs must belong to the same repository.");
  if (original.url === repair.url)
    throw new TransitionError("A separate verified repair PR is required.");
  const git = (args: string[]) => dependencies.git(args, cwd);
  if (git(["fetch", "--quiet", "origin", `refs/heads/${REVIEW_BASE}`]) === null)
    throw new TransitionError("Cannot fetch fresh develop evidence.");
  const develop = oid.parse(git(["rev-parse", "--verify", "FETCH_HEAD^{commit}"]));
  // A source is explicit whole-tree evidence, never a patch similarity override.
  // Resolve commit objects only; refs/abbreviations and non-commit objects cannot certify it.
  let sourceTree: string | undefined;
  if (source) {
    if (git(["rev-parse", "--verify", `${source}^{commit}`]) !== source)
      throw new TransitionError("Historical source must identify an exact commit object.");
    sourceTree = oid.parse(git(["rev-parse", "--verify", `${source}^{tree}`]));
    if (sourceTree !== git(["rev-parse", "--verify", `${original.headRefOid}^{tree}`]))
      throw new TransitionError("Historical source must have the original tested head's exact whole tree.");
  }
  const integratedOriginal = source ?? original.mergeCommit.oid;
  for (const [ancestor, descendant] of [
    ...(historical ? [[original.headRefOid, original.mergeCommit.oid]] : []),
    ...(source ? [[source, original.headRefOid]] : []),
    [integratedOriginal, repair.headRefOid],
    [repair.headRefOid, repair.mergeCommit.oid],
    [repair.mergeCommit.oid, develop],
    [integratedOriginal, develop],
  ]) {
    if (
      !ancestor ||
      !descendant ||
      git(["merge-base", "--is-ancestor", ancestor, descendant]) === null
    )
      throw new TransitionError(
        "Repair must contain the original merge or explicitly verified source, with all required ancestry reachable from fresh develop.",
      );
  }
  // Criteria must already be complete in the tested repair, not added later on develop.
  for (const commit of [...(historical ? [original.headRefOid] : []), repair.headRefOid, develop]) {
    const text = git(["show", `${commit}:${ticketPath}`]);
    const checked = text ? criteria(parseTicket(text, ticketPath)) : [];
    if (!checked.length || checked.some((criterion) => !criterion.checked))
      throw new TransitionError(
        "The tested repair and current develop must contain completed original acceptance criteria.",
      );
  }
  const originalRun = historical ? verifiedRun(cwd, original.headRefOid, dependencies, true) : null;
  const runUrl = verifiedRun(cwd, repair.headRefOid, dependencies, false);
  if (historical && verifiedRun(cwd, original.headRefOid, dependencies, true) !== originalRun)
    throw new TransitionError("Original CI changed while verifying the integration.");
  if (historical && verifiedRun(cwd, repair.headRefOid, dependencies, false) !== runUrl)
    throw new TransitionError("Integration CI changed during historical reconciliation.");
  // Reject changed metadata for either PR, including original stacked identity.
  for (const [ref, previous] of [
    [originalRef, original],
    [repairNumber, repair],
  ] as const) {
    const again = readPr(ref);
    if (JSON.stringify(again) !== JSON.stringify(previous))
      throw new TransitionError("PR evidence changed during reconciliation; retry.");
  }
  return {
    original: original.url,
    originalHead: original.headRefOid,
    originalMerge: original.mergeCommit.oid,
    originalBase: original.baseRefName,
    originalRun,
    source,
    sourceTree,
    integrationMerge: repair.mergeCommit.oid,
    repair: repair.url,
    head: repair.headRefOid,
    develop,
    run: runUrl,
  };
}

const metadataJobNames = [
  "verification scope", "tickets valid", "no AI attribution in PR text", "pnpm verify",
  "migrations + seed", "invitation journey (mobile + desktop)",
  "camera QR pixels (Chromium + WebKit)", "admin journey (mobile + desktop)",
  "required CI gates", "full verification proof",
].map((name) => `${name} (metadata only)`);

/** Only the exact, completed all-skipped metadata workflow is ignorable. */
export function isMetadataOnlyRun(value: unknown, expectedHead: string): boolean {
  const parsed = z.object({
    headSha: z.literal(expectedHead), event: z.literal("pull_request"),
    status: z.literal("completed"), conclusion: z.enum(["success", "skipped"]),
    jobs: z.array(z.object({name: z.string(), status: z.literal("completed"), conclusion: z.literal("skipped")})),
  }).safeParse(value);
  return parsed.success && parsed.data.jobs.length === metadataJobNames.length &&
    metadataJobNames.every((name) => parsed.data.jobs.some((job) => job.name === name));
}

export function verifiedRun(cwd: string, head: string, dependencies: Dependencies, historical: boolean) {
  const read = (id: number) => dependencies.gh([
    "run", "view", String(id), "--json", "databaseId,headSha,status,conclusion,event,url,jobs",
  ], cwd);
  const latestCodeRun = () => {
    const runs = z.array(z.object({databaseId: z.number().int().positive()})).parse(dependencies.gh([
      "run", "list", "--workflow", "ci.yml", "--commit", head, "--event", "pull_request",
      "--limit", "20", "--json", "databaseId",
    ], cwd));
    for (const candidate of runs) {
      const evidence = read(candidate.databaseId);
      if (z.object({databaseId:z.literal(candidate.databaseId)}).safeParse(evidence).success === false)
        throw new TransitionError("CI run identity changed while reading evidence.");
      if (!isMetadataOnlyRun(evidence, head)) return {id:candidate.databaseId,evidence};
    }
    // Bound the search and fail closed rather than assume older unseen evidence passed.
    throw new TransitionError("No implementation CI found in the latest 20 runs; rerun full CI.");
  };
  const latest = latestCodeRun();
  const runUrl = verifyRepairRun(latest.evidence, head, historical);
  const current = latestCodeRun();
  if (current.id !== latest.id)
    throw new TransitionError("A newer repair CI run appeared; wait for its completed result.");
  if (verifyRepairRun(current.evidence, head, historical) !== runUrl)
    throw new TransitionError("Repair CI evidence changed during reconciliation.");
  // Reruns retain an ID: re-read it after the latest-run scan as well.
  const finalRun = read(latest.id);
  if (verifyRepairRun(finalRun, head, historical) !== runUrl || runSchema.parse(finalRun).databaseId !== latest.id)
    throw new TransitionError("Repair CI evidence changed during reconciliation.");
  return runUrl;
}
