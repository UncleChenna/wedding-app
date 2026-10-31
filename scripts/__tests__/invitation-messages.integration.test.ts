import { existsSync } from "node:fs";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { assertDatabaseTarget } from "../database-target";
import * as schema from "../../src/modules/shared/server/db/schema";

const rollback = new Error("rollback message fixtures");
let sql: Sql;
let database: PostgresJsDatabase<typeof schema>;
type Transaction = Parameters<Parameters<typeof database.transaction>[0]>[0];
async function exercise(run: (tx: Transaction) => Promise<void>) {
  try {
    await database.transaction(async (tx) => {
      // Isolate the singleton inside this rolled-back transaction; seeded data is restored.
      await tx.delete(schema.eventSettings);
      await run(tx);
      throw rollback;
    });
  } catch (error) {
    if (error !== rollback) throw error;
  }
}

describe.runIf(process.env.RUN_MESSAGE_DB_TESTS === "1")("stored invitation messages", () => {
  beforeAll(() => {
    process.loadEnvFile(".env.local");
    if (!existsSync(".harness/worktree.json")) throw new Error("Managed test worktree required");
    const url = process.env.DATABASE_URL ?? "";
    assertDatabaseTarget(url, { localOnly: true });
    sql = postgres(url, { max: 1, connect_timeout: 10 });
    database = drizzle(sql, { schema });
  });
  afterAll(async () => {
    if (sql) await sql.end();
  });
  it("defaults to the approved Warm voice", async () => {
    await exercise(async (tx) => {
      const [row] = await tx.insert(schema.eventSettings).values({ id: 1 }).returning();
      expect(row?.invitationVoice).toBe("warm");
    });
  });
  it("renders persisted voice changes immediately and preserves unrelated settings", async () => {
    const { saveInvitationVoice, getEventSettings } =
      await import("../../src/modules/shared/server/settings");
    const { getInvitationMessages } = await import("../../src/modules/invitations/server/messages");
    await exercise(async (tx) => {
      await tx.insert(schema.eventSettings).values({ venue: "Message test venue" });
      for (const [voice, prefix] of [
        ["formal", "Dear Amara,"],
        ["playful", "Amara, consider this your golden ticket."],
        ["warm", "Hi Amara, two hearts"],
      ] as const) {
        expect(await saveInvitationVoice(voice, tx)).toEqual({ ok: true });
        const result = await getInvitationMessages(
          { guestName: "Amara", link: "https://example.test/i/fixture" },
          tx,
        );
        expect(result.ok).toBe(true);
        if (result.ok) expect(result.messages.whatsapp.startsWith(prefix)).toBe(true);
        expect(await getEventSettings(tx)).toMatchObject({
          invitationVoice: voice,
          venue: "Message test venue",
        });
      }
    });
  });
  it("rejects an unsupported voice before mutation", async () => {
    const { saveInvitationVoice, getEventSettings } =
      await import("../../src/modules/shared/server/settings");
    await exercise(async (tx) => {
      await tx.insert(schema.eventSettings).values({ id: 1 });
      expect(await saveInvitationVoice("unknown", tx)).toEqual({
        ok: false,
        message: "Choose Warm, Playful or Formal.",
      });
      expect((await getEventSettings(tx)).invitationVoice).toBe("warm");
    });
  });
  it("enforces the same voice choices for direct database writes", async () => {
    try {
      await sql.begin(async (tx) => {
        await tx`delete from event_settings`;
        await tx`insert into event_settings default values`;
        await expect(
          tx.savepoint((sp) => sp`update event_settings set invitation_voice = 'unknown'`),
        ).rejects.toMatchObject({ code: "23514" });
        await expect(
          tx.savepoint((sp) => sp`update event_settings set invitation_voice = null`),
        ).rejects.toMatchObject({ code: "23502" });
        throw rollback;
      });
    } catch (error) {
      if (error !== rollback) throw error;
    }
  });
});
