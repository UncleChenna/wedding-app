import visualMetadataOnlyRun from "./fixtures/ci-visual-metadata-only-run.json" with { type: "json" };
import metadataOnlyRun from "./fixtures/ci-metadata-only-run.json" with { type: "json" };
import { describe, expect, it } from "vitest";
import { isMetadataOnlyRun, verifiedRun, verifyRepairRun } from "../tickets/reconcile";

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
  it("permits the historical four-job workflow only for original evidence", () => {
    const historicalRun = { ...run, jobs: jobs.slice(0, 4) };
    expect(verifyRepairRun(historicalRun, head, true)).toBe(run.url);
    expect(() => verifyRepairRun(historicalRun, head)).toThrow();
    for (const state of ["skipped", "failure", "pending"]) {
      const broken = {
        ...run,
        jobs: jobs.map((job, index) => (index === 4 ? { ...job, conclusion: state } : job)),
      };
      expect(() => verifyRepairRun(broken, head)).toThrow();
    }
  });
  it("rejects malformed remote metadata", () => {
    expect(() => verifyRepairRun(null, head)).toThrow();
    expect(() => verifyRepairRun({ ...run, jobs: undefined }, head)).toThrow();
  });
});

it("requires actual full-suite proof for the scoped workflow, never targeted success", () => {
  const names = [
    "verification scope",
    "required CI gates",
    "full verification proof",
    "no AI attribution in PR text",
    "tickets valid",
    "pnpm verify",
    "migrations + seed",
    "invitation journey (mobile + desktop)",
    "admin journey (mobile + desktop)",
    "camera QR pixels (Chromium + WebKit)",
  ];
  const scoped = {
    ...run,
    jobs: names.map((name) => ({ name, status: "completed", conclusion: "success" })),
  };
  expect(verifyRepairRun(scoped, head)).toBe(run.url);
  expect(() =>
    verifyRepairRun(
      { ...scoped, jobs: scoped.jobs.filter((job) => job.name !== "full verification proof") },
      head,
    ),
  ).toThrow();
  expect(() =>
    verifyRepairRun(
      {
        ...scoped,
        jobs: scoped.jobs.map((job) =>
          job.name === "full verification proof" ? { ...job, conclusion: "skipped" } : job,
        ),
      },
      head,
    ),
  ).toThrow();
});

it("ignores only the exact completed metadata-only workflow, never newer code failures", () => {
  const names = [
    "verification scope",
    "tickets valid",
    "no AI attribution in PR text",
    "pnpm verify",
    "migrations + seed",
    "invitation journey (mobile + desktop)",
    "camera QR pixels (Chromium + WebKit)",
    "admin journey (mobile + desktop)",
    "required CI gates",
    "full verification proof",
  ];
  const metadata = {
    ...run,
    jobs: names.map((name) => ({
      name: `${name} (metadata only)`,
      status: "completed",
      conclusion: "skipped",
    })),
  };
  expect(isMetadataOnlyRun(metadata, head)).toBe(true);
  for (const change of [
    { status: "in_progress" },
    { conclusion: "failure" },
    { headSha: "b".repeat(40) },
    { jobs: metadata.jobs.slice(1) },
    { jobs },
  ])
    expect(isMetadataOnlyRun({ ...metadata, ...change }, head)).toBe(false);
  expect(isMetadataOnlyRun(run, head)).toBe(false);
});

it("selects intact full evidence past metadata edits but never past newer real pending/failed CI", () => {
  const names = [
    "verification scope",
    "tickets valid",
    "no AI attribution in PR text",
    "pnpm verify",
    "migrations + seed",
    "invitation journey (mobile + desktop)",
    "camera QR pixels (Chromium + WebKit)",
    "admin journey (mobile + desktop)",
    "required CI gates",
    "full verification proof",
  ];
  const metadata = {
    ...run,
    databaseId: 43,
    jobs: names.map((name) => ({
      name: `${name} (metadata only)`,
      status: "completed",
      conclusion: "skipped",
    })),
  };
  const proof = (newest: unknown) =>
    verifiedRun(
      ".",
      head,
      {
        git: () => null,
        gh: (args) =>
          args[1] === "list"
            ? [{ databaseId: 43 }, { databaseId: 42 }]
            : args[2] === "43"
              ? newest
              : run,
      },
      false,
    );
  expect(proof(metadata)).toBe(run.url);
  expect(proof({ ...visualMetadataOnlyRun, databaseId: 43, headSha: head })).toBe(run.url);
  expect(
    proof({
      ...metadata,
      jobs: [
        ...metadata.jobs,
        {
          name: "visual regression (guest pages) (metadata only)",
          status: "completed",
          conclusion: "skipped",
        },
      ],
    }),
  ).toBe(run.url);
  expect(() => proof({ ...run, databaseId: 43, status: "in_progress", conclusion: "" })).toThrow();
  expect(() => proof({ ...run, databaseId: 43, conclusion: "failure" })).toThrow();
  let lists = 0;
  expect(() =>
    verifiedRun(
      ".",
      head,
      {
        git: () => null,
        gh: (args) =>
          args[1] === "list"
            ? ++lists === 1
              ? [{ databaseId: 42 }]
              : [{ databaseId: 44 }, { databaseId: 42 }]
            : args[2] === "44"
              ? { ...run, databaseId: 44, status: "in_progress", conclusion: "" }
              : run,
      },
      false,
    ),
  ).toThrow(/newer repair CI/);
});

it("recognizes GitHub's actual unevaluated skipped-job names without accepting other expressions", () => {
  // Captured from metadata-only run 43202976665; no test suite ran in this event.
  expect(isMetadataOnlyRun(metadataOnlyRun, metadataOnlyRun.headSha)).toBe(true);
  const jobs = metadataOnlyRun.jobs.map((job, index) =>
    index === 0 ? { ...job, name: job.name.replace("github.event.action", "unknown.action") } : job,
  );
  expect(isMetadataOnlyRun({ ...metadataOnlyRun, jobs }, metadataOnlyRun.headSha)).toBe(false);
  expect(
    isMetadataOnlyRun(
      {
        ...metadataOnlyRun,
        jobs: metadataOnlyRun.jobs.map((job, index) =>
          index === 0 ? { ...job, conclusion: "failure" } : job,
        ),
      },
      metadataOnlyRun.headSha,
    ),
  ).toBe(false);
  expect(
    isMetadataOnlyRun(
      {
        ...metadataOnlyRun,
        jobs: metadataOnlyRun.jobs.map((job, index) =>
          index === 0 ? metadataOnlyRun.jobs[1] : job,
        ),
      },
      metadataOnlyRun.headSha,
    ),
  ).toBe(false);
});

it("recognises the captured eleven-job visual workflow while rejecting malformed variants", () => {
  expect(isMetadataOnlyRun(visualMetadataOnlyRun, visualMetadataOnlyRun.headSha)).toBe(true);
  for (const change of [
    { event: "workflow_dispatch" },
    { headSha: "f".repeat(40) },
    { status: "in_progress" },
    { conclusion: "failure" },
    { jobs: visualMetadataOnlyRun.jobs.slice(1) },
    { jobs: [...visualMetadataOnlyRun.jobs, visualMetadataOnlyRun.jobs[0]] },
    {
      jobs: visualMetadataOnlyRun.jobs.map((job, index) =>
        index === 0 ? visualMetadataOnlyRun.jobs[1] : job,
      ),
    },
    {
      jobs: visualMetadataOnlyRun.jobs.map((job) => ({
        ...job,
        name: job.name.replace("github.event.action", "other.event.action"),
      })),
    },
    {
      jobs: visualMetadataOnlyRun.jobs.map((job, index) =>
        index === 0 ? { ...job, name: "unknown (metadata only)" } : job,
      ),
    },
    {
      jobs: visualMetadataOnlyRun.jobs.map((job, index) =>
        index === 0 ? { ...job, conclusion: "success" } : job,
      ),
    },
    {
      jobs: visualMetadataOnlyRun.jobs.map((job, index) =>
        index === 0 ? { ...job, status: "in_progress" } : job,
      ),
    },
  ])
    expect(
      isMetadataOnlyRun({ ...visualMetadataOnlyRun, ...change }, visualMetadataOnlyRun.headSha),
    ).toBe(false);
});
