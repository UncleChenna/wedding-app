import { randomUUID } from "node:crypto";
import postgres, { type Sql } from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { assertDatabaseTarget } from "../database-target";
import * as schema from "../../src/modules/shared/server/db/schema";
import { readPassReminderRows } from "../../src/modules/admin/server/pass-reminder-repository";

describe.runIf(process.env.RUN_PASS_REMINDER_DB_TESTS === "1")(
  "attending pass reminder selection",
  () => {
    let client: Sql;
    beforeAll(() => {
      process.loadEnvFile(".env.local");
      const url = process.env.DATABASE_URL ?? "";
      assertDatabaseTarget(url, { localOnly: true });
      client = postgres(url, { max: 1 });
    });
    afterAll(async () => {
      if (client) await client.end();
    });
    it("includes every attending invitation and excludes all other statuses", async () => {
      const rollback = new Error("rollback synthetic pass reminder fixtures");
      try {
        await drizzle(client, { schema }).transaction(async (tx) => {
          const rows = await tx
            .insert(schema.invitations)
            .values(
              [...schema.invitationStatus.enumValues, "rsvp_yes" as const].map((status) => ({
                householdName: randomUUID(),
                status,
              })),
            )
            .returning();
          const selected = (await readPassReminderRows(tx)).filter((row) =>
            rows.some((fixture) => fixture.id === row.id),
          );
          expect(selected.map((row) => row.id).sort()).toEqual(
            rows
              .filter((row) => row.status === "rsvp_yes")
              .map((row) => row.id)
              .sort(),
          );
          expect(selected).toHaveLength(2);
          throw rollback;
        });
      } catch (error) {
        if (error !== rollback) throw error;
      }
    });
  },
);
