import { randomInt, randomUUID } from "node:crypto";
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

  it("waits for an accepted order to commit, then rejects subsequent orders", async () => {
    const { createOrder } = await import("../../src/modules/ordering/server/create-order");
    const [saved] = await client`select * from event_settings where id=1`;
    const tableId = randomUUID(),
      menuId = randomUUID();
    const table = randomInt(100000, 900000);
    const observer = postgres(process.env.DATABASE_URL ?? "", { max: 1 });
    let release: () => void = () => {};
    let accepted: () => void = () => {};
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    const ready = new Promise<void>((resolve) => {
      accepted = resolve;
    });
    let order: Promise<unknown> | undefined;
    let closure: Promise<unknown> | undefined;
    try {
      // This test must never revoke pre-existing identities outside its fixtures.
      const [identities] =
        await client`select (select count(*) from staff)::int as staff, (select count(*) from registered_devices)::int as devices`;
      expect(identities).toEqual({ staff: 0, devices: 0 });
      await client`insert into event_settings(id,event_date,time_zone,ordering_open) values(1,'2000-01-01','Etc/UTC',true)
        on conflict(id) do update set event_date='2000-01-01',time_zone='Etc/UTC',ordering_open=true`;
      await client`insert into tables(id,number,name,capacity) values(${tableId},${table},'Closure concurrency fixture',4)`;
      await client`insert into menu_items(id,name,category_v2,station,is_available) values(${menuId},'Closure water','soft_drink','bar',true)`;
      const submission = {
        clientRequestId: randomUUID(),
        table,
        items: [{ menuItemId: menuId, quantity: 1 }],
        note: "",
      };
      order = database.transaction(async (tx) => {
        const result = await createOrder(tx, submission);
        expect(result.status).toBe("created");
        accepted();
        await held;
        return result;
      });
      // If setup fails, propagate it rather than hanging on the handshake.
      await Promise.race([ready, order]);
      closure = closeEvent(database, {
        confirmation: "CLOSE EVENT",
        eventDate: "2000-01-01",
        evidencePreserved: true,
      });
      await expect
        .poll(async () => {
          const [waiting] = await observer`select count(*)::int as total from pg_stat_activity
          where datname=current_database() and wait_event_type='Lock'
          and query like '%event_settings%' and query like '%for update%'`;
          return waiting?.total;
        })
        .toBe(1);
      release();
      await order;
      expect(await closure).toMatchObject({ status: "closed" });
      expect(await createOrder(database, { ...submission, clientRequestId: randomUUID() })).toEqual(
        {
          status: "rejected",
          reason: "closed",
        },
      );
      const [persisted] =
        await client`select count(*)::int as total from orders where table_id=${tableId}`;
      expect(persisted?.total).toBe(1);
    } finally {
      release();
      await Promise.allSettled([order, closure]);
      await client`delete from orders where table_id=${tableId}`;
      await client`delete from menu_items where id=${menuId}`;
      await client`delete from tables where id=${tableId}`;
      if (saved) {
        const { id: _id, ...columns } = saved;
        await client`update event_settings set ${client(columns)} where id=1`;
      } else await client`delete from event_settings where id=1`;
      await observer.end();
    }
  });
});
