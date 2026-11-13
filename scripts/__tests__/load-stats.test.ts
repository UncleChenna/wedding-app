import { describe, expect, it } from "vitest";
import { passes, percentile, report, schedule, summarize } from "../load/stats";

describe("percentile", () => {
  it("uses nearest rank and ignores input order", () => {
    const values = [5, 1, 4, 2, 3, 6, 7, 8, 9, 10];
    expect(percentile(values, 50)).toBe(5);
    expect(percentile(values, 95)).toBe(10);
    expect(percentile(values, 100)).toBe(10);
    expect(percentile([42], 95)).toBe(42);
    expect(percentile([], 95)).toBeNull();
  });
});

describe("summarize and passes", () => {
  it("times successes only and counts every outcome", () => {
    const summary = summarize([
      { ms: 100, ok: true, outcome: "recorded" },
      { ms: 300, ok: true, outcome: "duplicate" },
      { ms: 9000, ok: false, outcome: "network" },
    ]);
    expect(summary).toMatchObject({ count: 3, failures: 1, p50: 100, p95: 300, max: 300 });
    expect(summary.outcomes).toEqual({ recorded: 1, duplicate: 1, network: 1 });
    expect(passes({ name: "x", summary, p95LimitMs: 1000 })).toBe(false);
  });

  it("needs samples, no failures and a p95 under the limit", () => {
    const fast = summarize([{ ms: 200, ok: true, outcome: "ok" }]);
    expect(passes({ name: "x", summary: fast, p95LimitMs: 1000 })).toBe(true);
    expect(passes({ name: "x", summary: fast, p95LimitMs: 200 })).toBe(false);
    expect(passes({ name: "x", summary: summarize([]), p95LimitMs: 1000 })).toBe(false);
  });
});

describe("report", () => {
  const target = {
    name: "Scan to result",
    summary: summarize([{ ms: 120, ok: true, outcome: "valid" }]),
    p95LimitMs: 1000,
  };
  it("passes only when timings pass and nothing was lost", () => {
    const ok = report({
      title: "Load",
      environment: ["local"],
      targets: [target],
      reconciliation: [{ name: "People admitted", expected: 3, actual: 3 }],
    });
    expect(ok.passed).toBe(true);
    expect(ok.markdown).toContain("**Result: PASS**");
    expect(ok.markdown).toContain(
      "| Scan to result | 1 | 0 | 120 ms | 120 ms | 120 ms | < 1000 ms | pass |",
    );
    const lost = report({
      title: "Load",
      environment: [],
      targets: [target],
      reconciliation: [{ name: "Orders stored", expected: 30, actual: 29 }],
    });
    expect(lost.passed).toBe(false);
    expect(lost.markdown).toContain("| Orders stored | 30 | 29 | FAIL |");
  });
});

describe("schedule", () => {
  it("spreads starts across the window in order", () => {
    const starts = schedule(4, 1000, () => 0);
    expect(starts).toEqual([0, 250, 500, 750]);
    const jittered = schedule(10, 60_000);
    expect(jittered).toHaveLength(10);
    expect(Math.max(...jittered)).toBeLessThan(60_000);
    expect(schedule(0, 1000)).toEqual([]);
  });
});
