import { describe, expect, it } from "vitest";
import { verifyRepairRun } from "../tickets/reconcile";

const head = "a".repeat(40);
const jobs = [
  "tickets valid",
  "no AI attribution in PR text",
  "pnpm verify",
  "migrations + seed",
  "invitation journey (mobile + desktop)",
].map((name) => ({ name, status: "completed", conclusion: "success" }));
const run = {
  databaseId: 42,
  headSha: head,
  status: "completed",
  conclusion: "success",
  event: "pull_request",
  url: "https://github.com/o/r/actions/runs/42",
  jobs,
};

describe("verified repair CI", () => {
  it("accepts completed exact-head CI with every required job", () => {
    expect(verifyRepairRun(run, head)).toBe(run.url);
  });
  it.each(["failure", "cancelled", "skipped", "neutral", ""])(
    "rejects %s conclusions",
    (conclusion) => {
      expect(() => verifyRepairRun({ ...run, conclusion }, head)).toThrow();
    },
  );
  it("rejects pending, stale head, wrong event and optional-only checks", () => {
    expect(() => verifyRepairRun({ ...run, status: "in_progress" }, head)).toThrow();
    expect(() => verifyRepairRun(run, "b".repeat(40))).toThrow();
    expect(() => verifyRepairRun({ ...run, event: "workflow_dispatch" }, head)).toThrow();
    expect(() =>
      verifyRepairRun(
        { ...run, jobs: [{ name: "review", status: "completed", conclusion: "success" }] },
        head,
      ),
    ).toThrow();
  });
  it("requires every job, including additional future required gates, to succeed", () => {
    expect(() => verifyRepairRun({ ...run, jobs: jobs.slice(1) }, head)).toThrow();
    expect(() =>
      verifyRepairRun(
        {
          ...run,
          jobs: [...jobs, { name: "admin journey", status: "completed", conclusion: "failure" }],
        },
        head,
      ),
    ).toThrow();
    expect(() =>
      verifyRepairRun(
        { ...run, jobs: jobs.map((job) => ({ ...job, conclusion: "skipped" })) },
        head,
      ),
    ).toThrow();
  });
  it("rejects malformed remote metadata", () => {
    expect(() => verifyRepairRun(null, head)).toThrow();
    expect(() => verifyRepairRun({ ...run, jobs: undefined }, head)).toThrow();
  });
});
