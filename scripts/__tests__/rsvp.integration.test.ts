import { randomBytes } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import postgres, { type Sql } from "postgres";
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { assertDatabaseTarget } from "../database-target";
import * as schema from "../../src/modules/shared/server/db/schema";

import type { saveRsvp } from "../../src/modules/invitations/server/save-rsvp";
import type { Db } from "../../src/modules/shared/server/db/client";

let sql: Sql;
let save: typeof saveRsvp;
const rollback = new Error("rollback local RSVP fixtures");
describe.runIf(process.env.RUN_RSVP_DB_TESTS === "1")(
  "RSVP persistence in isolated Postgres",
  () => {
    beforeAll(async () => {
      process.loadEnvFile(".env.local");
      assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
      sql = postgres(process.env.DATABASE_URL ?? "", { max: 2 });
      save = (await import("../../src/modules/invitations/server/save-rsvp")).saveRsvp;
    });
    afterAll(async () => {
      if (sql) await sql.end();
    });
    async function exercise(
      run: (tx: Parameters<Parameters<Db["transaction"]>[0]>[0]) => Promise<void>,
    ) {
      const database = drizzle(sql, { schema });
      try {
        await database.transaction(async (tx) => {
          await run(tx);
          throw rollback;
        });
      } catch (error) {
        if (error !== rollback) throw error;
      }
    }
    it("atomically stores attendance/status and updates one RSVP on repeated replies", async () => {
      await exercise(async (tx) => {
        await tx
          .insert(schema.eventSettings)
          .values({ id: 1, timeZone: "Etc/UTC" })
          .onConflictDoUpdate({ target: schema.eventSettings.id, set: { timeZone: "Etc/UTC" } });
        const [invitation] = await tx
          .insert(schema.invitations)
          .values({ status: "sent", householdName: "RSVP test only" })
          .returning();
        if (!invitation) throw new Error("Missing fixture");
        await tx.insert(schema.guests).values([
          { invitationId: invitation.id, name: "Primary", isPrimary: true },
          { invitationId: invitation.id, name: "Second", isPrimary: true },
        ]);
        for (const attending of [true, false, true]) {
          expect(await save(tx, invitation.token, attending)).toBe("saved");
          const rows = await tx
            .select()
            .from(schema.rsvps)
            .where(eq(schema.rsvps.invitationId, invitation.id));
          expect(rows).toHaveLength(1);
          expect(rows[0]).toMatchObject({ attending, countAttending: attending ? 2 : 0 });
          const [updated] = await tx
            .select()
            .from(schema.invitations)
            .where(eq(schema.invitations.id, invitation.id));
          expect(updated?.status).toBe(attending ? "rsvp_yes" : "rsvp_no");
        }
      });
    });
    it.each(["draft", "revoked"] as const)(
      "rejects %s invitations without creating an RSVP",
      async (status) => {
        await exercise(async (tx) => {
          const [invitation] = await tx.insert(schema.invitations).values({ status }).returning();
          if (!invitation) throw new Error("Missing fixture");
          expect(await save(tx, invitation.token, true)).toBe("unavailable");
          expect(
            await tx
              .select()
              .from(schema.rsvps)
              .where(eq(schema.rsvps.invitationId, invitation.id)),
          ).toEqual([]);
        });
      },
    );
    it("rejects malformed and unknown tokens", async () => {
      const database = drizzle(sql, { schema });
      expect(await save(database, "short", true)).toBe("unavailable");
      expect(await save(database, randomBytes(32).toString("base64url"), true)).toBe("unavailable");
    });
    it("does not activate RSVP when the venue timezone is still TBD", async () => {
      await exercise(async (tx) => {
        await tx
          .insert(schema.eventSettings)
          .values({ id: 1 })
          .onConflictDoUpdate({
            target: schema.eventSettings.id,
            set: { timeZone: null, rsvpLockAt: null },
          });
        const [invitation] = await tx
          .insert(schema.invitations)
          .values({ status: "sent" })
          .returning();
        if (!invitation) throw new Error("Missing fixture");
        expect(await save(tx, invitation.token, true)).toBe("not-open");
        const [unchanged] = await tx
          .select()
          .from(schema.invitations)
          .where(eq(schema.invitations.id, invitation.id));
        expect(unchanged?.status).toBe("sent");
        expect(
          await tx.select().from(schema.rsvps).where(eq(schema.rsvps.invitationId, invitation.id)),
        ).toEqual([]);
      });
    });
  },
);
