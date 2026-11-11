import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, sql } from "drizzle-orm";
import postgres, { type Sql } from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { assertDatabaseTarget } from "../database-target";
import { resetSeedTables } from "../seed-reset";
import * as schema from "../../src/modules/shared/server/db/schema";
import type { Db } from "../../src/modules/shared/server/db/client";
import type {
  readScanLogPage as Reader,
  appendScanNote as Writer,
} from "../../src/modules/admin/server/scan-log-repository";

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
const rollback = new Error("rollback synthetic scan log fixtures");
describe.runIf(process.env.RUN_SCAN_LOG_DB_TESTS === "1")("admin scan log persistence", () => {
  let client: Sql;
  let database: Db;
  let read: typeof Reader;
  let append: typeof Writer;
  beforeAll(async () => {
    if (existsSync(".env.local")) process.loadEnvFile(".env.local");
    const url = process.env.DATABASE_URL ?? "";
    assertDatabaseTarget(url, { localOnly: true });
    client = postgres(url, { max: 2, connect_timeout: 10, prepare: false, onnotice: () => {} });
    database = drizzle(client, { schema });
    ({ readScanLogPage: read, appendScanNote: append } =
      await import("../../src/modules/admin/server/scan-log-repository"));
  });
  afterAll(async () => {
    if (client) await client.end();
  });
  async function exercise(run: (tx: Tx) => Promise<void>) {
    try {
      await database.transaction(async (tx) => {
        await run(tx);
        throw rollback;
      });
    } catch (error) {
      if (error !== rollback) throw error;
    }
  }
  async function fixtures(tx: Tx) {
    const invitationId = randomUUID(),
      staffId = randomUUID(),
      deviceId = randomUUID();
    await tx.insert(schema.invitations).values({
      id: invitationId,
      householdName: "Synthetic scan household",
      status: "rsvp_yes",
      token: `PRIVATE-TOKEN-${randomUUID()}`,
    });
    await tx.insert(schema.staff).values({
      id: staffId,
      name: "Synthetic gate",
      role: "gate",
      email: `PRIVATE-${randomUUID()}@example.invalid`,
    });
    await tx
      .insert(schema.registeredDevices)
      .values({ id: deviceId, name: "Synthetic north gate", role: "gate" });
    const rows = await tx
      .insert(schema.scanEvents)
      .values(
        (["valid", "already_used", "invalid", "revoked", "not_rsvped"] as const).map(
          (result, index) => ({
            invitationId: result === "invalid" ? null : invitationId,
            staffId,
            deviceId,
            clientEventId: randomUUID(),
            reportedAt: new Date(`2099-12-19T12:0${index}:00Z`),
            receivedAt: new Date(`2099-12-19T12:2${index}:00Z`),
            reportedResult: "valid" as const,
            result,
            reportedPeople: 1,
            admittedPeople: 0,
            conflict: true,
            source: "offline",
            inputMethod: "manual",
          }),
        ),
      )
      .returning({ id: schema.scanEvents.id, result: schema.scanEvents.result });
    const first = rows[0];
    if (!first) throw new Error("Missing fixture scan");
    return { invitationId, staffId, deviceId, eventId: first.id };
  }
  it("filters all five results, unknown identities, transport and UTC received time without private data", async () => {
    await exercise(async (tx) => {
      const fixture = await fixtures(tx);
      for (const result of ["valid", "already_used", "invalid", "revoked", "not_rsvped"] as const) {
        const page = await read(tx, {
          page: 1,
          staff: fixture.staffId,
          device: fixture.deviceId,
          result,
          source: "offline",
          conflict: true,
        });
        expect(page.entries).toHaveLength(1);
        expect(page.entries[0]).toMatchObject({
          result,
          reportedResult: "valid",
          inputMethod: "manual",
          source: "offline",
          conflict: true,
        });
        expect(JSON.stringify(page)).not.toMatch(/PRIVATE-|pinHash|dietary|token/);
      }
      expect(
        (await read(tx, { page: 1, staff: fixture.staffId, invitation: "unknown" })).entries,
      ).toHaveLength(1);
      expect(
        (await read(tx, { page: 1, staff: fixture.staffId, invitation: fixture.invitationId }))
          .entries,
      ).toHaveLength(4);
      expect(
        (
          await read(tx, {
            page: 1,
            staff: fixture.staffId,
            from: "2099-12-19T12:21:00.000Z",
            to: "2099-12-19T12:22:00.000Z",
          })
        ).entries,
      ).toHaveLength(2);
      expect(
        (await read(tx, { page: 1, staff: fixture.staffId, conflict: false })).entries,
      ).toHaveLength(0);
    });
  });
  it("appends an idempotent resolution without changing any original scan column", async () => {
    await exercise(async (tx) => {
      const fixture = await fixtures(tx);
      const before = await tx
        .select()
        .from(schema.scanEvents)
        .where(eq(schema.scanEvents.id, fixture.eventId));
      const note = {
        eventId: fixture.eventId,
        requestId: randomUUID(),
        adminId: randomUUID(),
        resolution: "reviewed" as const,
      };
      expect(await append(tx, note)).toEqual({ status: "saved" });
      expect(await append(tx, note)).toEqual({ status: "saved" });
      expect(await append(tx, { ...note, resolution: "escalated" })).toEqual({
        status: "conflict",
      });
      expect(await append(tx, { ...note, adminId: randomUUID() })).toEqual({ status: "conflict" });
      const page = await read(tx, { page: 1, staff: fixture.staffId, result: "valid" });
      expect(page.entries[0]?.notes).toHaveLength(1);
      expect(page.entries[0]?.notes[0]?.resolution).toBe("reviewed");
      expect(
        await tx.select().from(schema.scanEvents).where(eq(schema.scanEvents.id, fixture.eventId)),
      ).toEqual(before);
      expect(await append(tx, { ...note, eventId: randomUUID(), requestId: randomUUID() })).toEqual(
        { status: "not-found" },
      );
    });
  });
  it("deduplicates concurrent retries across database transactions", async () => {
    // This fixture is committed solely in the guarded disposable database; its
    // append-only evidence is retained rather than disabling guards for cleanup.
    const fixture = await database.transaction(fixtures);
    const note = {
      eventId: fixture.eventId,
      requestId: randomUUID(),
      adminId: randomUUID(),
      resolution: "reviewed" as const,
    };
    expect(await Promise.all([append(database, note), append(database, note)])).toEqual([
      { status: "saved" },
      { status: "saved" },
    ]);
    expect(
      await database
        .select()
        .from(schema.scanResolutionNotes)
        .where(eq(schema.scanResolutionNotes.requestId, note.requestId)),
    ).toHaveLength(1);
  });
  it("enforces append-only notes and closed resolution values in PostgreSQL", async () => {
    await exercise(async (tx) => {
      const fixture = await fixtures(tx);
      await append(tx, {
        eventId: fixture.eventId,
        requestId: randomUUID(),
        adminId: randomUUID(),
        resolution: "reviewed",
      });
      for (const statement of [
        sql`update scan_resolution_notes set resolution='escalated' where event_id=${fixture.eventId}`,
        sql`delete from scan_resolution_notes where event_id=${fixture.eventId}`,
        sql`truncate scan_resolution_notes`,
        sql`insert into scan_resolution_notes(event_id,request_id,admin_id,resolution) values(${fixture.eventId},${randomUUID()},${randomUUID()},'PIN 123456')`,
      ])
        await expect(
          tx.transaction(async (savepoint) => {
            await savepoint.execute(statement);
          }),
        ).rejects.toThrow();
    });
  });
  it("RLS prevents browser roles from reading notes even with a table grant", async () => {
    await exercise(async (tx) => {
      const fixture = await fixtures(tx);
      await append(tx, {
        eventId: fixture.eventId,
        requestId: randomUUID(),
        adminId: randomUUID(),
        resolution: "reviewed",
      });
      await tx.execute(sql`grant select on scan_resolution_notes to anon, authenticated`);
      for (const role of ["anon", "authenticated"] as const) {
        await tx.transaction(async (savepoint) => {
          await savepoint.execute(
            role === "anon" ? sql`set local role anon` : sql`set local role authenticated`,
          );
          expect(await savepoint.execute(sql`select id from scan_resolution_notes`)).toHaveLength(
            0,
          );
          await savepoint.execute(sql`reset role`);
        });
      }
    });
  });
  it("bounds pages and note history while retaining earlier notes", async () => {
    await exercise(async (tx) => {
      const fixture = await fixtures(tx);
      await tx.insert(schema.scanEvents).values(
        Array.from({ length: 26 }, () => ({
          clientEventId: randomUUID(),
          staffId: fixture.staffId,
          deviceId: fixture.deviceId,
          reportedAt: new Date(),
          reportedResult: "invalid" as const,
          result: "invalid" as const,
          reportedPeople: 0,
          admittedPeople: 0,
          source: "online",
        })),
      );
      const first = await read(tx, { page: 1, staff: fixture.staffId, source: "online" });
      const second = await read(tx, { page: 2, staff: fixture.staffId, source: "online" });
      expect(first.entries).toHaveLength(25);
      expect(first.hasMore).toBe(true);
      expect(second.entries).toHaveLength(1);
      expect(second.hasMore).toBe(false);
      expect(new Set([...first.entries, ...second.entries].map((entry) => entry.id)).size).toBe(26);
      for (let i = 0; i < 21; i++)
        await append(tx, {
          eventId: fixture.eventId,
          requestId: randomUUID(),
          adminId: randomUUID(),
          resolution: "reviewed",
        });
      expect(
        (await read(tx, { page: 1, staff: fixture.staffId, result: "valid" })).entries[0]?.notes,
      ).toHaveLength(20);
      expect(
        await tx
          .select()
          .from(schema.scanResolutionNotes)
          .where(eq(schema.scanResolutionNotes.eventId, fixture.eventId)),
      ).toHaveLength(21);
    });
  });
  it("restores note guards on successful synthetic reset and on rollback", async () => {
    await exercise(async (tx) => {
      const fixture = await fixtures(tx);
      await append(tx, {
        eventId: fixture.eventId,
        requestId: randomUUID(),
        adminId: randomUUID(),
        resolution: "reviewed",
      });
      const guards = () =>
        tx.execute(
          sql`select tgenabled from pg_trigger where tgname='scan_resolution_notes_append_only' and tgrelid='public.scan_resolution_notes'::regclass`,
        );
      expect(await guards()).toEqual([{ tgenabled: "O" }]);
      await expect(
        tx.transaction(async (savepoint) => {
          await resetSeedTables(async (statement) => {
            if (statement.includes("truncate table")) throw new Error("synthetic reset failure");
            return savepoint.execute(sql.raw(statement));
          });
        }),
      ).rejects.toThrow("synthetic reset failure");
      expect(await guards()).toEqual([{ tgenabled: "O" }]);
      expect(
        await tx
          .select()
          .from(schema.scanResolutionNotes)
          .where(eq(schema.scanResolutionNotes.eventId, fixture.eventId)),
      ).toHaveLength(1);
      await resetSeedTables((statement) => tx.execute(sql.raw(statement)));
      expect(await guards()).toEqual([{ tgenabled: "O" }]);
      expect(await tx.select().from(schema.scanResolutionNotes)).toHaveLength(0);
      await expect(
        tx.transaction((savepoint) => savepoint.execute(sql`delete from scan_resolution_notes`)),
      ).rejects.toThrow();
    });
  });
});
