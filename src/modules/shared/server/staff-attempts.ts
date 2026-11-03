import "server-only";

import { eq, sql } from "drizzle-orm";

import { db, schema } from "./db/client";

const WINDOW_MS = 10 * 60 * 1000;
export type PinAttemptResult<T> =
  { status: "success"; value: T } | { status: "wrong" | "expired" | "locked" };

/** Hold the device row lock until verification finishes, including across instances. */
export async function withStaffPinAttempt<T>(
  deviceId: string,
  verify: (tx: Parameters<Parameters<typeof db.transaction>[0]>[0]) => Promise<PinAttemptResult<T>>,
): Promise<PinAttemptResult<T>> {
  if (!/^[0-9a-f]{64}$/.test(deviceId)) return { status: "wrong" };
  return db.transaction(async (tx) => {
    await tx
      .insert(schema.staffPinAttempts)
      .values({ deviceId, failures: 0, windowStartedAt: sql`clock_timestamp()` })
      .onConflictDoNothing();
    const [row] = await tx
      .select()
      .from(schema.staffPinAttempts)
      .where(eq(schema.staffPinAttempts.deviceId, deviceId))
      .for("update");
    if (!row) throw new Error("Missing staff attempt row");
    // Read database time after acquiring the lock: queued requests may have waited.
    const [clock] = await tx
      .select({ now: sql<Date>`clock_timestamp()` })
      .from(schema.staffPinAttempts)
      .where(eq(schema.staffPinAttempts.deviceId, deviceId));
    if (!clock) throw new Error("Missing staff attempt clock");
    const now = new Date(clock.now);
    const reset = now.getTime() - row.windowStartedAt.getTime() >= WINDOW_MS;
    const failures = reset ? 0 : row.failures;
    if (failures >= 5) return { status: "locked" };
    const result = await verify(tx);
    const nextFailures = result.status === "success" ? 0 : failures + 1;
    await tx
      .update(schema.staffPinAttempts)
      .set({
        failures: nextFailures,
        windowStartedAt: reset || result.status === "success" ? now : row.windowStartedAt,
      })
      .where(eq(schema.staffPinAttempts.deviceId, deviceId));
    return nextFailures >= 5 ? { status: "locked" } : result;
  });
}
