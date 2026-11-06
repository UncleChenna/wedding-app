import { z } from "zod";

const hash = z.string().regex(/^[0-9a-f]{64}$/);
const timestamp = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
const databaseTimestamp = z.union([
  timestamp,
  z
    .string()
    .regex(/^[0-9]{1,16}$/)
    .transform(Number)
    .pipe(timestamp),
  z.bigint().transform(Number).pipe(timestamp),
]);
const appliedHistory = z.array(z.object({ hash, createdAt: databaseTimestamp }).strict());
const sourceHistory = z.array(z.object({ hash, createdAt: timestamp }).strict()).min(1);

export type MigrationHistoryResult =
  | { ok: true; pending: number }
  | { ok: false; code: "invalid-source-history" | "unrecognized-history" };

/** A later timestamp alone cannot make a divergent applied branch compatible. */
export function compareMigrationHistory(applied: unknown, source: unknown): MigrationHistoryResult {
  const expected = sourceHistory.safeParse(source);
  if (!expected.success) return { ok: false, code: "invalid-source-history" };
  let previous = -1;
  for (const entry of expected.data) {
    if (entry.createdAt <= previous) return { ok: false, code: "invalid-source-history" };
    previous = entry.createdAt;
  }
  const actual = appliedHistory.safeParse(applied);
  if (!actual.success || actual.data.length > expected.data.length)
    return { ok: false, code: "unrecognized-history" };
  for (let index = 0; index < actual.data.length; index++) {
    const current = actual.data[index];
    const target = expected.data[index];
    if (
      !current ||
      !target ||
      current.hash !== target.hash ||
      current.createdAt !== target.createdAt
    )
      return { ok: false, code: "unrecognized-history" };
  }
  return { ok: true, pending: expected.data.length - actual.data.length };
}
