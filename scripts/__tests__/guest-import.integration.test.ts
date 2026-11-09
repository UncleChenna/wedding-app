import { randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { assertDatabaseTarget } from "../database-target";
import * as schema from "../../src/modules/shared/server/db/schema";
import type { Db } from "../../src/modules/shared/server/db/client";
import { previewGuestImport, commitGuestImport } from "../../src/modules/admin/server/guest-import";
import type { ImportPreviewResult } from "../../src/modules/admin/lib/guest-import";

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
const rollback = new Error("Rollback synthetic CSV fixtures");
const actor = randomUUID();
const csv = (tag: string) =>
  `name,phone,email,party size,side,table\n${tag} Ada,,${tag}@example.invalid,2,bride,\n${tag} Uche,,,1,groom,`;
function key(result: ImportPreviewResult) {
  if (result.status !== "preview") throw new Error(JSON.stringify(result));
  return { previewId: result.preview.id, digest: result.preview.digest };
}
let client: Sql;
describe.runIf(process.env.RUN_GUEST_IMPORT_DB_TESTS === "1")(
  "atomic CSV imports on isolated PostgreSQL",
  () => {
    beforeAll(async () => {
      process.loadEnvFile(".env.local");
      const url = process.env.DATABASE_URL ?? "";
      assertDatabaseTarget(url, { localOnly: true });
      client = postgres(url, { max: 4, connect_timeout: 10 });
      await client`select 1`;
    });
    afterAll(async () => {
      if (client) await client.end();
    });
    async function exercise(run: (tx: Tx) => Promise<void>) {
      try {
        await drizzle(client, { schema }).transaction(async (tx) => {
          await run(tx);
          throw rollback;
        });
      } catch (e) {
        if (e !== rollback) throw e;
      }
    }
    it("commits drafts once, clears private preview data and replays a fresh equivalent preview", async () =>
      exercise(async (tx) => {
        const text = csv(randomUUID());
        const request = key(await previewGuestImport(tx, text, actor));
        const result = await commitGuestImport(tx, request, actor);
        expect(result.status).toBe("committed");
        if (result.status !== "committed") return;
        const stored = await tx
          .select()
          .from(schema.invitations)
          .where(inArray(schema.invitations.id, result.invitationIds));
        expect(stored).toHaveLength(2);
        expect(stored.every((i) => i.status === "draft")).toBe(true);
        expect(new Set(stored.map((i) => i.token)).size).toBe(2);
        const [batch] = await tx
          .select()
          .from(schema.guestImportBatches)
          .where(eq(schema.guestImportBatches.id, request.previewId));
        expect(batch?.csv).toBeNull();
        expect(batch?.tableSnapshot).toEqual([]);
        const repeat = key(await previewGuestImport(tx, text.replaceAll("\n", "\r\n"), actor));
        expect(repeat).toEqual(request);
        const [header, first, second] = text.split("\n");
        const reordered = key(
          await previewGuestImport(tx, [header, second, first].join("\n"), actor),
        );
        expect(reordered).toEqual(request);
        expect((await previewGuestImport(tx, text, randomUUID())).status).toBe("error");
        expect((await commitGuestImport(tx, request, randomUUID())).status).toBe("error");
        expect(await commitGuestImport(tx, repeat, actor)).toMatchObject({
          ...result,
          replayed: true,
        });
      }));
    it("rolls back every earlier inserted household if a later insert fails", async () =>
      exercise(async (tx) => {
        const request = key(await previewGuestImport(tx, csv(randomUUID()), actor));
        const before = await tx.select({ id: schema.invitations.id }).from(schema.invitations);
        await expect(commitGuestImport(tx, request, actor, () => "a".repeat(43))).rejects.toThrow();
        expect(await tx.select({ id: schema.invitations.id }).from(schema.invitations)).toEqual(
          before,
        );
        const [batch] = await tx
          .select()
          .from(schema.guestImportBatches)
          .where(eq(schema.guestImportBatches.id, request.previewId));
        expect(batch?.invitationIds).toBeNull();
        expect(batch?.csv).not.toBeNull();
      }));
    it("rejects forged identity, expired/renewed preview and contacts changed after preview", async () =>
      exercise(async (tx) => {
        const tag = randomUUID();
        const text = csv(tag);
        const first = key(await previewGuestImport(tx, text, actor));
        expect((await commitGuestImport(tx, first, randomUUID())).status).toBe("error");
        expect(
          (await commitGuestImport(tx, { ...first, digest: "0".repeat(64) }, actor)).status,
        ).toBe("error");
        await tx
          .update(schema.guestImportBatches)
          .set({ expiresAt: new Date(0) })
          .where(eq(schema.guestImportBatches.id, first.previewId));
        expect((await commitGuestImport(tx, first, actor)).status).toBe("error");
        const renewed = key(await previewGuestImport(tx, text, actor));
        expect(renewed.previewId).not.toBe(first.previewId);
        expect((await commitGuestImport(tx, first, actor)).status).toBe("error");
        const [invitation] = await tx
          .insert(schema.invitations)
          .values({ householdName: randomUUID() })
          .returning();
        if (!invitation) throw new Error("Missing fixture");
        await tx.insert(schema.guests).values({
          invitationId: invitation.id,
          name: "Existing",
          email: `${tag}@example.invalid`,
        });
        await tx
          .insert(schema.rsvps)
          .values({ invitationId: invitation.id, attending: true, countAttending: 1 });
        const before = await tx.select().from(schema.rsvps);
        expect((await commitGuestImport(tx, renewed, actor)).status).toBe("error");
        expect(await tx.select().from(schema.rsvps)).toEqual(before);
      }));
    it("rejects approval expiring while the commit waits for writer locks", async () =>
      exercise(async (tx) => {
        const request = key(await previewGuestImport(tx, csv(randomUUID()), actor));
        const before = await tx.select({ id: schema.invitations.id }).from(schema.invitations);
        const current = Date.now();
        const clock = vi
          .fn()
          .mockReturnValueOnce(current)
          .mockReturnValue(current + 31 * 60 * 1000);
        expect((await commitGuestImport(tx, request, actor, undefined, clock)).status).toBe(
          "error",
        );
        expect(clock).toHaveBeenCalledTimes(2);
        expect(await tx.select({ id: schema.invitations.id }).from(schema.invitations)).toEqual(
          before,
        );
        const [batch] = await tx
          .select()
          .from(schema.guestImportBatches)
          .where(eq(schema.guestImportBatches.id, request.previewId));
        expect(batch?.invitationIds).toBeNull();
      }));
    it("rejects table changes after the approved preview", async () =>
      exercise(async (tx) => {
        const [table] = await tx
          .insert(schema.tables)
          .values({ number: 2147483000, capacity: 8 })
          .returning();
        if (!table) throw new Error("Missing table");
        const text = `name,phone,email,party size,side,table\n${randomUUID()},,,1,,${table.number}`;
        const request = key(await previewGuestImport(tx, text, actor));
        await tx
          .update(schema.tables)
          .set({ number: 2147483001 })
          .where(eq(schema.tables.id, table.id));
        expect((await commitGuestImport(tx, request, actor)).status).toBe("error");
      }));
    it("concurrent commits on separate connections create one batch only", async () => {
      const db = drizzle(client, { schema });
      const request = key(await previewGuestImport(db, csv(randomUUID()), actor));
      let ids: string[] = [];
      try {
        const results = await Promise.all([
          commitGuestImport(db, request, actor),
          commitGuestImport(db, request, actor),
        ]);
        expect(results.every((r) => r.status === "committed")).toBe(true);
        if (results[0]?.status !== "committed" || results[1]?.status !== "committed")
          throw new Error("Expected commits");
        ids = results[0].invitationIds;
        expect(results[1].invitationIds).toEqual(ids);
        expect(results.map((r) => r.status === "committed" && r.replayed).sort()).toEqual([
          false,
          true,
        ]);
        expect(
          await db.select().from(schema.guests).where(inArray(schema.guests.invitationId, ids)),
        ).toHaveLength(2);
      } finally {
        const [batch] = await db
          .select()
          .from(schema.guestImportBatches)
          .where(eq(schema.guestImportBatches.id, request.previewId));
        ids = batch?.invitationIds ?? ids;
        if (ids.length)
          await db.delete(schema.invitations).where(inArray(schema.invitations.id, ids));
        await db
          .delete(schema.guestImportBatches)
          .where(eq(schema.guestImportBatches.id, request.previewId));
      }
    });
  },
);
