import "server-only";

import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "./db/client";
import { requestBudgets } from "./db/schema";

const budgetSchema = z.object({
  identity: z.string().regex(/^[0-9a-f]{64}$/),
  scope: z.enum(["lookup", "pin"]),
  limit: z.number().int().min(1).max(100000),
  windowSeconds: z.number().int().min(1).max(86400),
});
export type RequestBudget = z.infer<typeof budgetSchema>;
export type BudgetResult = { allowed: boolean; retryAfterSeconds: number };

/** One row lock per scope/network, shared by all application instances. */
export async function consumeRequestBudget(
  db: Pick<Db, "transaction" | "execute">,
  input: RequestBudget,
): Promise<BudgetResult> {
  const parsed = budgetSchema.safeParse(input);
  if (!parsed.success) return { allowed: false, retryAfterSeconds: 60 };
  const { identity, scope, limit, windowSeconds } = parsed.data;
  // Commit cleanup separately so requests for different keys cannot hold cleanup
  // locks while waiting for each other's counter. Never touch guest/staff records.
  await db.execute(sql`
      delete from ${requestBudgets} where (scope, identity) in (
        select scope, identity from ${requestBudgets}
        where expires_at <= clock_timestamp()
        order by expires_at limit 32 for update skip locked
      )
  `);
  return db.transaction(async (tx) => {
    const where = and(eq(requestBudgets.scope, scope), eq(requestBudgets.identity, identity));
    const [row] = await tx
      .insert(requestBudgets)
      .values({
        identity,
        scope,
        used: 0,
        expiresAt: sql`clock_timestamp()`,
      })
      .onConflictDoUpdate({
        target: [requestBudgets.scope, requestBudgets.identity],
        set: { scope },
      })
      .returning();
    if (!row) throw new Error("Missing request budget row");
    // Read time after acquiring the lock so queueing cannot extend an expired window.
    const [clock] = await tx
      .select({ now: sql<string>`clock_timestamp()` })
      .from(requestBudgets)
      .where(where);
    if (!clock) throw new Error("Missing request budget clock");
    const now = new Date(clock.now);
    const expired = row.expiresAt.getTime() <= now.getTime();
    const used = expired ? 0 : row.used;
    if (used >= limit) {
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, Math.ceil((row.expiresAt.getTime() - now.getTime()) / 1000)),
      };
    }
    await tx
      .update(requestBudgets)
      .set({
        used: used + 1,
        expiresAt: expired ? new Date(now.getTime() + windowSeconds * 1000) : row.expiresAt,
      })
      .where(where);
    return { allowed: true, retryAfterSeconds: 0 };
  });
}
