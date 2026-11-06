import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { assertDatabaseTarget } from "../database-target";
import * as schema from "../../src/modules/shared/server/db/schema";
import type { Db } from "../../src/modules/shared/server/db/client";
import type * as Repository from "../../src/modules/admin/server/event-closure-repository";
import type * as Pin from "../../src/modules/shared/server/staff-pin";

describe.runIf(process.env.RUN_EVENT_CLOSURE_DB_TESTS === "1")("event closure rehearsal", () => {
  let client: Sql;
  let database: Db;
  let closeEvent: typeof Repository.closeEvent;
  let hashStaffPin: typeof Pin.hashStaffPin;
  const rollback = new Error("rollback synthetic closure rehearsal");
  beforeAll(async () => {
    process.loadEnvFile(".env.local");
    const url = process.env.DATABASE_URL ?? "";
    assertDatabaseTarget(url, { localOnly: true });
    client = postgres(url, { max: 2, connect_timeout: 10 });
    database = drizzle(client, { schema });
    ({ closeEvent } = await import("../../src/modules/admin/server/event-closure-repository"));
    ({ hashStaffPin } = await import("../../src/modules/shared/server/staff-pin"));
  });
  afterAll(async () => {
    if (client) await client.end();
  });
  it("refuses early closure, revokes staff/devices atomically, preserves admin/evidence and repeats without changes", async () => {
    try {
      await database.transaction(async (tx) => {
        await tx
          .insert(schema.eventSettings)
          .values({ id: 1, eventDate: "2026-12-19", timeZone: "Africa/Lagos", orderingOpen: true })
          .onConflictDoUpdate({
            target: schema.eventSettings.id,
            set: { eventDate: "2026-12-19", timeZone: "Africa/Lagos", orderingOpen: true },
          });
        const gate = randomUUID(),
          admin = randomUUID(),
          device = randomUUID();
        await tx.insert(schema.staff).values([
          {
            id: gate,
            name: "Closure fixture",
            role: "gate",
            pinHash: await hashStaffPin("123456"),
            pinIssuedAt: new Date("2026-12-01T00:00:00Z"),
            pinExpiresAt: new Date("2026-12-20T05:00:00Z"),
          },
          { id: admin, name: "Closure admin", role: "admin" },
        ]);
        await tx
          .insert(schema.registeredDevices)
          .values({ id: device, name: "Closure scanner", role: "gate", registeredByStaffId: gate });
        const invitation = randomUUID(),
          guest = randomUUID(),
          admission = randomUUID();
        await tx.insert(schema.invitations).values({ id: invitation });
        await tx
          .insert(schema.guests)
          .values({ id: guest, invitationId: invitation, name: "Closure guest" });
        await tx.insert(schema.checkIns).values({
          id: admission,
          guestId: guest,
          staffId: gate,
          deviceId: device,
          checkedInAt: new Date("2026-12-19T12:00:00Z"),
          clientEventId: randomUUID(),
        });
        const input = {
          confirmation: "CLOSE EVENT",
          eventDate: "2026-12-19",
          evidencePreserved: true,
        };
        expect((await closeEvent(tx, input, () => new Date("2026-12-20T04:59:59Z"))).status).toBe(
          "too-early",
        );
        const [before] = await tx.select().from(schema.staff).where(eq(schema.staff.id, gate));
        expect(before?.revokedAt).toBeNull();
        const closed = await closeEvent(tx, input, () => new Date("2026-12-20T05:00:00Z"));
        expect(closed.status).toBe("closed");
        const [member] = await tx.select().from(schema.staff).where(eq(schema.staff.id, gate));
        expect(member).toMatchObject({
          pinHash: null,
          pinIssuedAt: null,
          pinExpiresAt: null,
          revokedAt: new Date("2026-12-20T05:00:00Z"),
        });
        const [administrator] = await tx
          .select()
          .from(schema.staff)
          .where(eq(schema.staff.id, admin));
        expect(administrator?.revokedAt).toBeNull();
        const [scanner] = await tx
          .select()
          .from(schema.registeredDevices)
          .where(eq(schema.registeredDevices.id, device));
        expect(scanner?.revokedAt).toEqual(new Date("2026-12-20T05:00:00Z"));
        const [event] = await tx
          .select()
          .from(schema.eventSettings)
          .where(eq(schema.eventSettings.id, 1));
        expect(event?.orderingOpen).toBe(false);
        expect(
          await tx.select().from(schema.checkIns).where(eq(schema.checkIns.id, admission)),
        ).toHaveLength(1);
        expect(await closeEvent(tx, input, () => new Date("2026-12-20T06:00:00Z"))).toEqual({
          status: "closed",
          staffRevoked: 0,
          devicesRevoked: 0,
        });
        const [repeated] = await tx.select().from(schema.staff).where(eq(schema.staff.id, gate));
        expect(repeated).toEqual(member);
        throw rollback;
      });
    } catch (error) {
      if (error !== rollback) throw error;
    }
  });
});
