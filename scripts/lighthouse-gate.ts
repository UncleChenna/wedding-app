import { z } from "zod";

export const LIGHTHOUSE_POLICY = {
  version: "13.6.0",
  runs: 3,
  performance: 0.95,
  accessibility: 0.95,
} as const;

const reportSchema = z.object({
  lighthouseVersion: z.literal(LIGHTHOUSE_POLICY.version),
  finalDisplayedUrl: z.string().url(),
  runtimeError: z.unknown().optional(),
  categories: z.object({
    performance: z.object({ score: z.number().min(0).max(1) }),
    accessibility: z.object({ score: z.number().min(0).max(1) }),
  }),
  audits: z.object({
    "http-status-code": z.object({ score: z.literal(1) }),
  }),
});

export function assessLighthouse(reports: unknown[], expectedUrl: string) {
  if (reports.length !== LIGHTHOUSE_POLICY.runs)
    throw new Error("Exactly three cold runs required");
  const parsed = reports.map((value) => reportSchema.parse(value));
  if (parsed.some((report) => report.runtimeError || report.finalDisplayedUrl !== expectedUrl))
    throw new Error("Lighthouse did not audit the intended successful guest page");
  const performance = parsed
    .map((report) => report.categories.performance.score)
    .sort((a, b) => a - b);
  const accessibility = parsed.map((report) => report.categories.accessibility.score);
  const median = performance[1];
  if (median === undefined) throw new Error("Missing median score");
  return {
    passed:
      median >= LIGHTHOUSE_POLICY.performance &&
      accessibility.every((score) => score >= LIGHTHOUSE_POLICY.accessibility),
    performance: parsed.map((report) => report.categories.performance.score),
    medianPerformance: median,
    accessibility,
  };
}
