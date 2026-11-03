import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/modules/shared/server/db/client";
import { tables } from "@/modules/shared/server/db/schema";

export async function findTable(number: number) {
  const [table] = await db
    .select({ id: tables.id, number: tables.number })
    .from(tables)
    .where(eq(tables.number, number))
    .limit(1);
  return table ?? null;
}
