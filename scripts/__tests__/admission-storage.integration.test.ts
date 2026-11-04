import { randomUUID } from "node:crypto";
import postgres, { type Sql } from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { assertDatabaseTarget } from "../database-target";

let db: Sql;
const rollback = new Error("rollback admission storage fixture");

describe.runIf(process.env.RUN_ADMISSION_DB_TESTS === "1")("admission storage", () => {
  beforeAll(() => {
    process.loadEnvFile(".env.local");
    const url = process.env.DATABASE_URL ?? "";
    assertDatabaseTarget(url, { localOnly: true });
    db = postgres(url, { max: 2, prepare: false, connect_timeout: 5, onnotice: () => {} });
  });
  afterAll(async () => {
    if (db) await db.end({ timeout: 1 });
  });

  it("retains an unknown-invitation attempt, enforces retry identity and rejects mutation", async () => {
    try {
      await db.begin(async (tx) => {
        const staffId = randomUUID(),
          deviceId = randomUUID(),
          eventId = randomUUID();
        await tx`insert into staff(id,name,role) values (${staffId},'Synthetic gate','gate')`;
        await tx`insert into registered_devices(id,name,role,registered_by_staff_id) values (${deviceId},'Synthetic scanner','gate',${staffId})`;
        const [event] = await tx`
          insert into scan_events(client_event_id,staff_id,device_id,reported_at,reported_result,result,reported_people,admitted_people,source)
          values (${eventId},${staffId},${deviceId},'2026-12-19T12:00:00Z','invalid','invalid',0,0,'online') returning *`;
        expect(event?.invitation_id).toBeNull();
        expect(event?.client_event_id).toBe(eventId);
        await expect(
          tx.savepoint(async (sp) => {
            await sp`insert into scan_events(client_event_id,staff_id,device_id,reported_at,reported_result,result,reported_people,admitted_people,source)
            values (${eventId},${staffId},${deviceId},'2026-12-19T12:00:00Z','invalid','invalid',0,0,'online')`;
          }),
        ).rejects.toMatchObject({ code: "23505" });
        await expect(
          tx.savepoint(async (sp) => {
            await sp`update scan_events set reported_people=1 where client_event_id=${eventId}`;
          }),
        ).rejects.toMatchObject({ code: "42501" });
        await expect(
          tx.savepoint(async (sp) => {
            await sp`delete from scan_events where client_event_id=${eventId}`;
          }),
        ).rejects.toMatchObject({ code: "42501" });
        throw rollback;
      });
    } catch (error) {
      if (error !== rollback) throw error;
    }
  }, 15_000);

  it("keeps new storage private under row-level security", async () => {
    const rows =
      await db`select relname,relrowsecurity from pg_class where oid in ('public.scan_events'::regclass,'public.admission_counters'::regclass) order by relname`;
    expect(rows).toEqual([
      { relname: "admission_counters", relrowsecurity: true },
      { relname: "scan_events", relrowsecurity: true },
    ]);
  }, 10_000);

  it("rejects a forged allowance and an RSVP reduction below accepted admissions", async () => {
    try {
      await db.begin(async (tx) => {
        const invitationId = randomUUID();
        await tx`insert into invitations(id,token,status) values (${invitationId},${randomUUID().replaceAll("-", "")},'rsvp_yes')`;
        await tx`insert into rsvps(invitation_id,attending,count_attending) values (${invitationId},true,4)`;
        await expect(
          tx.savepoint(async (sp) => {
            await sp`insert into admission_counters(invitation_id,allowance,admitted_people) values (${invitationId},100,5)`;
          }),
        ).rejects.toMatchObject({ code: "23514" });
        await tx`insert into admission_counters(invitation_id,allowance,admitted_people) values (${invitationId},4,2)`;
        await expect(
          tx.savepoint(async (sp) => {
            await sp`update rsvps set count_attending=1 where invitation_id=${invitationId}`;
          }),
        ).rejects.toMatchObject({ code: "23514" });
        await tx`update rsvps set count_attending=3 where invitation_id=${invitationId}`;
        const [counter] =
          await tx`select allowance,admitted_people from admission_counters where invitation_id=${invitationId}`;
        expect(counter).toMatchObject({ allowance: 3, admitted_people: 2 });
        throw rollback;
      });
    } catch (error) {
      if (error !== rollback) throw error;
    }
  }, 15_000);
});
