/** Pure timing maths and the Markdown report for the load test (TICKET-137). */

export type Sample = { ms: number; ok: boolean; outcome: string };

export type Summary = {
  count: number;
  failures: number;
  p50: number | null;
  p95: number | null;
  max: number | null;
  outcomes: Record<string, number>;
};

/** Nearest-rank percentile of successful samples; null when there are none. */
export function percentile(values: readonly number[], p: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.ceil((p / 100) * sorted.length);
  return sorted[Math.min(sorted.length, Math.max(1, rank)) - 1] ?? null;
}

export function summarize(samples: readonly Sample[]): Summary {
  const times = samples.filter((sample) => sample.ok).map((sample) => sample.ms);
  const outcomes: Record<string, number> = {};
  for (const sample of samples) outcomes[sample.outcome] = (outcomes[sample.outcome] ?? 0) + 1;
  return {
    count: samples.length,
    failures: samples.filter((sample) => !sample.ok).length,
    p50: percentile(times, 50),
    p95: percentile(times, 95),
    max: times.length ? Math.max(...times) : null,
    outcomes,
  };
}

export type Target = { name: string; summary: Summary; p95LimitMs: number };

/** A target passes when nothing failed and its p95 is inside the limit. */
export function passes(target: Target): boolean {
  return (
    target.summary.count > 0 &&
    target.summary.failures === 0 &&
    target.summary.p95 !== null &&
    target.summary.p95 < target.p95LimitMs
  );
}

const ms = (value: number | null) => (value === null ? "–" : `${Math.round(value)} ms`);

export type Reconciliation = { name: string; expected: number; actual: number };

export function report(input: {
  title: string;
  environment: string[];
  targets: Target[];
  reconciliation: Reconciliation[];
}): { markdown: string; passed: boolean } {
  const reconciled = input.reconciliation.every((row) => row.expected === row.actual);
  const passed = input.targets.every(passes) && reconciled;
  const lines = [
    `# ${input.title}`,
    "",
    `**Result: ${passed ? "PASS" : "FAIL"}**`,
    "",
    "## Environment",
    "",
    ...input.environment.map((line) => `- ${line}`),
    "",
    "## Timings",
    "",
    "| Measure | Count | Failed | p50 | p95 | Max | Limit (p95) | Result |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |",
    ...input.targets.map(
      (target) =>
        `| ${target.name} | ${target.summary.count} | ${target.summary.failures} | ${ms(target.summary.p50)} | ${ms(target.summary.p95)} | ${ms(target.summary.max)} | < ${target.p95LimitMs} ms | ${passes(target) ? "pass" : "FAIL"} |`,
    ),
    "",
    "## Outcomes",
    "",
    ...input.targets.map(
      (target) =>
        `- ${target.name}: ${
          Object.entries(target.summary.outcomes)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([outcome, count]) => `${outcome} ${count}`)
            .join(", ") || "none"
        }`,
    ),
    "",
    "## Nothing lost",
    "",
    "| Check | Expected | In the database | Result |",
    "| --- | ---: | ---: | --- |",
    ...input.reconciliation.map(
      (row) =>
        `| ${row.name} | ${row.expected} | ${row.actual} | ${row.expected === row.actual ? "pass" : "FAIL"} |`,
    ),
    "",
  ];
  return { markdown: lines.join("\n"), passed };
}

/** Evenly spaced start offsets across a window, with a little jitter so requests don't align. */
export function schedule(count: number, windowMs: number, random: () => number = Math.random) {
  if (count <= 0) return [];
  const gap = windowMs / count;
  return Array.from({ length: count }, (_, index) =>
    Math.round(index * gap + random() * gap * 0.5),
  );
}
