import { z } from "zod";
const count = z.int().min(0).max(Number.MAX_SAFE_INTEGER);
export const healthReadingSchema = z.object({
  realtime: z.boolean(),
  pending: count,
  failed: count,
  lastSync: z.iso.datetime({ offset: true }).nullable(),
});
export const healthSnapshotSchema = z.object({
  checkedAt: z.iso.datetime(),
  database: z.enum(["ready", "unavailable"]),
  realtime: z.enum(["configured", "unavailable", "unknown"]),
  outbox: z.object({ pending: count, failed: count }).nullable(),
  lastSync: z.iso.datetime({ offset: true }).nullable(),
  version: z.string().max(40),
});
export type HealthSnapshot = z.infer<typeof healthSnapshotSchema>;
export function healthSnapshot(
  reading: z.infer<typeof healthReadingSchema> | null,
  version: string | undefined,
  now = new Date(),
): HealthSnapshot {
  return {
    checkedAt: now.toISOString(),
    database: reading ? "ready" : "unavailable",
    realtime: reading ? (reading.realtime ? "configured" : "unavailable") : "unknown",
    outbox: reading ? { pending: reading.pending, failed: reading.failed } : null,
    lastSync: reading?.lastSync ?? null,
    version:
      version && /^[a-f0-9]{7,40}$/i.test(version)
        ? version.slice(0, 12)
        : "Local or unlabelled build",
  };
}
