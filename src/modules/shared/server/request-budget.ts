import "server-only";

import { sql } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "./db/client";
import { requestBudgets } from "./db/schema";

const budgetSchema = z.object({
  identity: z.string().regex(/^[0-9a-f]{64}$/),
  scope: z.enum(["lookup", "pin", "lost_link", "ordering"]),
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
  // One statement decides and records the request, so the shared row is locked only while that
  // statement runs. A multi-statement transaction held it across app round trips: under load
  // every request queued on it and exhausted the connection pool, stalling unrelated routes such
  // as gate scans (TICKET-258). The update applies only while budget remains; no row back means
  // the request is refused.
  const allowed = await db.execute(sql`
    insert into ${requestBudgets} (scope, identity, used, expires_at)
    values (
      ${scope},
      ${identity},
      1,
      clock_timestamp() + make_interval(secs => ${windowSeconds})
    )
    on conflict (scope, identity) do update set
      used = case
        when ${requestBudgets.expiresAt} <= clock_timestamp() then 1
        else ${requestBudgets.used} + 1
      end,
      expires_at = case
        when ${requestBudgets.expiresAt} <= clock_timestamp()
          then clock_timestamp() + make_interval(secs => ${windowSeconds})
        else ${requestBudgets.expiresAt}
      end
    where ${requestBudgets.expiresAt} <= clock_timestamp() or ${requestBudgets.used} < ${limit}
    returning 1 as allowed
  `);
  if ([...allowed].length > 0) return { allowed: true, retryAfterSeconds: 0 };
  const [left] = [
    ...(await db.execute<{ seconds: number | string | null }>(sql`
      select ceil(extract(epoch from expires_at - clock_timestamp())) as seconds
      from ${requestBudgets} where scope = ${scope} and identity = ${identity}
    `)),
  ];
  return { allowed: false, retryAfterSeconds: Math.max(1, Number(left?.seconds ?? 1) || 1) };
}
