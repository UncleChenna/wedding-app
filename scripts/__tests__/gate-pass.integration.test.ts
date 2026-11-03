import { readFileSync } from "node:fs";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import postgres, { type Sql } from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as schema from "../../src/modules/shared/server/db/schema";
import { findStoredPass } from "../../src/modules/checkin/server/pass-repository";
import { passEligibility } from "../../src/modules/checkin/lib/pass-eligibility";

let sql: Sql;
const rollback = new Error("rollback fixtures");
const enabled = process.env.RUN_INVITATION_DB_TESTS === "1";

describe.runIf(enabled)("gate pass lookup on isolated Postgres", () => {
  beforeAll(async () => {
    process.loadEnvFile(".env.local");
    const config = readFileSync(".harness/supabase-project/supabase/config.toml", "utf8");
    const port = config
      .split("[db]\n")[1]
      ?.split("\n[")[0]
      ?.match(/^port\s*=\s*(\d+)$/m)?.[1];
    const url = new URL(process.env.DATABASE_URL ?? "");
    if (!["localhost", "127.0.0.1"].includes(url.hostname) || !port || url.port !== port)
      throw new Error("Use this worktree's isolated database only");
    sql = postgres(url.toString(), { max: 1, connect_timeout: 10 });
    await sql`select 1`;
  });
  afterAll(async () => {
    if (sql) await sql.end();
  });

  it("reads status, version, RSVP count, table and primary names only, across the state matrix", async () => {
    const db = drizzle(sql, { schema });
    try {
      await db.transaction(async (tx) => {
        const [table] = await tx
          .insert(schema.tables)
          .values({ number: 9_412, capacity: 8 })
          .returning({ id: schema.tables.id });
        const [invitation] = await tx
          .insert(schema.invitations)
          .values({ householdName: "Pass household", status: "sent", tableId: table?.id })
          .returning({ id: schema.invitations.id });
        if (!invitation) throw new Error("fixture");
        const { id } = invitation;
        await tx.insert(schema.guests).values([
          { invitationId: id, name: "Primary guest", isPrimary: true, phone: "+44123456789" },
          { invitationId: id, name: "Tag along", isPrimary: false, dietaryNotes: "private" },
        ]);
        const payload = { v: 1 as const, kid: "k1", inv: id, ver: 1, iat: 1 };

        expect(await findStoredPass(tx, "not-a-uuid")).toBeNull();
        expect(passEligibility(payload, await findStoredPass(tx, id))).toEqual({
          state: "not-attending",
        });

        await tx
          .insert(schema.rsvps)
          .values({ invitationId: id, attending: true, countAttending: 2 });
        await tx
          .update(schema.invitations)
          .set({ status: "rsvp_yes" })
          .where(eq(schema.invitations.id, id));
        const stored = await findStoredPass(tx, id);
        expect(stored).toEqual({
          status: "rsvp_yes",
          tokenVersion: 1,
          householdName: "Pass household",
          tableNumber: 9_412,
          attending: true,
          countAttending: 2,
          primaryNames: ["Primary guest"],
        });
        expect(JSON.stringify(stored)).not.toMatch(/\+44|private|Tag along/);
        expect(passEligibility(payload, stored).state).toBe("valid");

        await tx
          .update(schema.invitations)
          .set({ tokenVersion: 2 })
          .where(eq(schema.invitations.id, id));
        expect(passEligibility(payload, await findStoredPass(tx, id))).toEqual({
          state: "replaced",
        });

        await tx
          .update(schema.invitations)
          .set({ status: "revoked" })
          .where(eq(schema.invitations.id, id));
        expect(passEligibility(payload, await findStoredPass(tx, id))).toEqual({
          state: "revoked",
        });
        throw rollback;
      });
    } catch (error) {
      if (error !== rollback) throw error;
    }
  });
});
