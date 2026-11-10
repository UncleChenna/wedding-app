import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import postgres, { type Sql, type TransactionSql } from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { assertDatabaseTarget } from "../database-target";
import { resetSeedTables } from "../seed-reset";

let db: Sql;
const rollback = new Error("rollback admission storage fixture");

async function applyProposal(tx: TransactionSql, namespace: string, path: string) {
  const source = readFileSync(path, "utf8")
    .replaceAll('"public".', `"${namespace}".`)
    .replaceAll("public.", `"${namespace}".`);
  await tx.unsafe(source).simple();
}
async function installProposal(
  tx: TransactionSql,
  namespace: string,
  options: { legacy?: boolean; beforeBackfill?: (tx: TransactionSql) => Promise<void> } = {},
) {
  await tx.unsafe(`create schema "${namespace}"`);
  await tx.unsafe(`set local search_path to "${namespace}", pg_catalog`);
  // Exercise the final generated migrations, including populated backfill fixtures.
  const journal = JSON.parse(readFileSync("drizzle/meta/_journal.json", "utf8")) as {
    entries: { tag: string }[];
  };
  const migrations = options.legacy
    ? journal.entries.filter((entry) => /^(0000_|0009_|0010_)/.test(entry.tag))
    : journal.entries.filter((entry) => Number(entry.tag.slice(0, 4)) < 16);
  for (const migration of migrations) {
    await applyProposal(tx, namespace, `drizzle/${migration.tag}.sql`);
  }
  await applyProposal(tx, namespace, "drizzle/0016_admission-expand.sql");
  await options.beforeBackfill?.(tx);
  await applyProposal(tx, namespace, "drizzle/0017_admission-backfill.sql");
  await applyProposal(tx, namespace, "drizzle/0018_admission-guards.sql");
  // The current local seed reset also covers later import and scan-note tables.
  // Install its real generated migrations for the historical reset rehearsal.
  for (const migration of journal.entries.filter(
    (entry) =>
      entry.tag === "0021_guest-import-batches" ||
      /_scan-resolution-(notes|guards)$/.test(entry.tag),
  )) {
    await applyProposal(tx, namespace, `drizzle/${migration.tag}.sql`);
  }
}
async function storageTransaction<T>(
  run: (tx: TransactionSql, namespace: string) => Promise<T>,
  options: { legacy?: boolean; beforeBackfill?: (tx: TransactionSql) => Promise<void> } = {},
): Promise<T> {
  let result: { value: T } | undefined;
  try {
    await db.begin(async (tx) => {
      let namespace = "public";
      if (process.env.ADMISSION_SCHEMA_PROPOSAL === "1") {
        namespace = "admission_test_" + randomUUID().replaceAll("-", "");
        await installProposal(tx, namespace, options);
      }
      result = { value: await run(tx, namespace) };
      throw rollback;
    });
  } catch (error) {
    if (error !== rollback) throw error;
  }
  if (!result) throw new Error("Storage test did not return a result");
  return result.value;
}

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

  it.runIf(process.env.ADMISSION_SCHEMA_PROPOSAL === "1")(
    "restores seed guards after success and rollback without losing retained evidence on failure",
    async () => {
      await storageTransaction(async (tx, namespace) => {
        const staffId = randomUUID(),
          deviceId = randomUUID();
        await tx`insert into staff(id,name,role) values (${staffId},'Synthetic gate','gate')`;
        await tx`insert into registered_devices(id,name,role,registered_by_staff_id) values (${deviceId},'Synthetic scanner','gate',${staffId})`;
        await tx`insert into scan_events(client_event_id,staff_id,device_id,reported_at,reported_result,result,reported_people,admitted_people,source)
          values (${randomUUID()},${staffId},${deviceId},now(),'invalid','invalid',0,0,'online')`;
        const guards = async () => tx`select t.tgname,t.tgenabled from pg_trigger t
          join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace
          where n.nspname=${namespace} and t.tgname in
          ('rsvp_history_append_only','scan_events_append_only','admission_counters_no_removal','rsvp_admission_no_truncate','guest_admission_no_truncate') order by t.tgname`;
        const before = await guards();
        expect(before).toHaveLength(5);
        expect(before.every((row) => row.tgenabled === "O")).toBe(true);
        await expect(
          tx.savepoint(async (sp) => {
            await resetSeedTables(async (statement) => {
              if (statement.includes("truncate table")) throw new Error("synthetic reset failure");
              await sp.unsafe(statement).simple();
            });
          }),
        ).rejects.toThrow("synthetic reset failure");
        expect(await guards()).toEqual(before);
        expect(await tx`select id from scan_events`).toHaveLength(1);
        await expect(
          tx.savepoint(async (sp) => {
            await resetSeedTables(async (statement) => {
              await sp.unsafe(statement).simple();
            });
            throw new Error("synthetic fixture insertion failure");
          }),
        ).rejects.toThrow("synthetic fixture insertion failure");
        expect(await guards()).toEqual(before);
        expect(await tx`select id from scan_events`).toHaveLength(1);
        await resetSeedTables(async (statement) => {
          await tx.unsafe(statement).simple();
        });
        expect(await guards()).toEqual(before);
        expect(await tx`select id from scan_events`).toHaveLength(0);
        await expect(
          tx.savepoint(async (sp) => {
            await sp`delete from scan_events`;
          }),
        ).rejects.toMatchObject({ code: "42501" });
      });
    },
  );

  it("retains an unknown-invitation attempt, enforces retry identity and rejects mutation", async () => {
    await storageTransaction(async (tx) => {
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
    });
  }, 15_000);

  it("keeps new storage private under row-level security", async () => {
    await storageTransaction(async (tx, namespace) => {
      const rows =
        await tx`select relname,relrowsecurity from pg_class where oid in (${namespace + ".scan_events"}::regclass,${namespace + ".admission_counters"}::regclass) order by relname`;
      expect(rows).toEqual([
        { relname: "admission_counters", relrowsecurity: true },
        { relname: "scan_events", relrowsecurity: true },
      ]);
      const guards = await tx`select t.tgenabled from pg_trigger t
        join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace
        where n.nspname=${namespace} and t.tgname in
        ('rsvp_history_append_only','scan_events_append_only','admission_counters_no_removal','rsvp_admission_no_truncate','guest_admission_no_truncate')`;
      expect(guards).toHaveLength(5);
      expect(guards.every((row) => row.tgenabled === "O")).toBe(true);
    });
  }, 10_000);

  it("rejects impossible reports, unflagged excess, unknown results and missing live identities", async () => {
    await storageTransaction(async (tx) => {
      const staffId = randomUUID(),
        deviceId = randomUUID();
      await tx`insert into staff(id,name,role) values (${staffId},'Synthetic gate','gate')`;
      await tx`insert into registered_devices(id,name,role) values (${deviceId},'Synthetic scanner','gate')`;
      const cases = [
        { reported: "invalid", people: 1, conflict: true, staff: staffId, code: "23514" },
        { reported: "valid", people: 1, conflict: false, staff: staffId, code: "23514" },
        { reported: "valid", people: -1, conflict: true, staff: staffId, code: "23514" },
        { reported: "unknown-result", people: 0, conflict: false, staff: staffId, code: "22P02" },
        { reported: "invalid", people: 0, conflict: false, staff: null, code: "23514" },
        { reported: "invalid", people: 0, conflict: false, staff: randomUUID(), code: "23503" },
      ];
      for (const row of cases) {
        await expect(
          tx.savepoint(async (sp) => {
            await sp`insert into scan_events(client_event_id,staff_id,device_id,reported_at,reported_result,result,reported_people,admitted_people,conflict,source)
              values (${randomUUID()},${row.staff},${deviceId},'2026-12-19T12:00:00Z',${row.reported},'invalid',${row.people},0,${row.conflict},'offline')`;
          }),
        ).rejects.toMatchObject({ code: row.code });
      }
    });
  }, 15_000);

  it("rejects a forged allowance and an RSVP reduction below accepted admissions", async () => {
    await storageTransaction(async (tx) => {
      const invitationId = randomUUID();
      const staffId = randomUUID(),
        deviceId = randomUUID();
      await tx`insert into staff(id,name,role) values (${staffId},'Synthetic gate','gate')`;
      await tx`insert into registered_devices(id,name,role) values (${deviceId},'Synthetic scanner','gate')`;
      await tx`insert into invitations(id,token,status) values (${invitationId},${randomUUID().replaceAll("-", "")},'rsvp_yes')`;
      await tx`insert into rsvps(invitation_id,attending,count_attending) values (${invitationId},true,4)`;
      await expect(
        tx.savepoint(async (sp) => {
          await sp`insert into admission_counters(invitation_id,allowance,admitted_people) values (${invitationId},100,5)`;
        }),
      ).rejects.toMatchObject({ code: "23514" });
      await tx`insert into scan_events(client_event_id,invitation_id,staff_id,device_id,reported_at,reported_result,result,reported_people,admitted_people,source)
          values (${randomUUID()},${invitationId},${staffId},${deviceId},'2026-12-19T12:00:00Z','valid','valid',2,2,'online')`;
      await expect(
        tx.savepoint(async (sp) => {
          await sp`update admission_counters set admitted_people=3 where invitation_id=${invitationId}`;
        }),
      ).rejects.toMatchObject({ code: "23514" });
      await expect(
        tx.savepoint(async (sp) => {
          await sp`update rsvps set count_attending=1 where invitation_id=${invitationId}`;
        }),
      ).rejects.toMatchObject({ code: "23514" });
      await tx`update rsvps set count_attending=3 where invitation_id=${invitationId}`;
      const [counter] =
        await tx`select allowance,admitted_people from admission_counters where invitation_id=${invitationId}`;
      expect(counter).toMatchObject({ allowance: 3, admitted_people: 2 });
    });
  }, 15_000);

  it("retains every scan result and rolls back excess admissions without losing evidence", async () => {
    await storageTransaction(async (tx) => {
      const invitationId = randomUUID(),
        staffId = randomUUID(),
        deviceId = randomUUID();
      await tx`insert into staff(id,name,role) values (${staffId},'Synthetic gate','gate')`;
      await tx`insert into registered_devices(id,name,role) values (${deviceId},'Synthetic scanner','gate')`;
      await tx`insert into invitations(id,token,status) values (${invitationId},${randomUUID().replaceAll("-", "")},'rsvp_yes')`;
      await tx`insert into rsvps(invitation_id,attending,count_attending) values (${invitationId},true,1)`;
      const results = ["valid", "already_used", "invalid", "revoked", "not_rsvped"];
      for (const result of results) {
        const people = result === "valid" ? 1 : 0;
        await tx`insert into scan_events(client_event_id,invitation_id,staff_id,device_id,reported_at,reported_result,result,reported_people,admitted_people,source)
          values (${randomUUID()},${invitationId},${staffId},${deviceId},'2026-12-19T12:00:00Z',${result},${result},${people},${people},'online')`;
      }
      const excessId = randomUUID();
      await expect(
        tx.savepoint(async (sp) => {
          await sp`insert into scan_events(client_event_id,invitation_id,staff_id,device_id,reported_at,reported_result,result,reported_people,admitted_people,source)
          values (${excessId},${invitationId},${staffId},${deviceId},'2026-12-19T12:01:00Z','valid','valid',1,1,'online')`;
        }),
      ).rejects.toMatchObject({ code: "23514" });
      expect(await tx`select id from scan_events where client_event_id=${excessId}`).toHaveLength(
        0,
      );
      const stored = await tx`select result from scan_events where invitation_id=${invitationId}`;
      expect(stored.map((row) => row.result).sort()).toEqual([...results].sort());
      // Preserve a conflicting offline physical report without increasing canonical admissions.
      await tx`insert into scan_events(client_event_id,invitation_id,staff_id,device_id,reported_at,reported_result,result,reported_people,admitted_people,conflict,source)
        values (${excessId},${invitationId},${staffId},${deviceId},'2026-12-19T12:01:00Z','valid','already_used',1,0,true,'offline')`;
      const [counts] =
        await tx`select sum(reported_people)::integer as reported,sum(admitted_people)::integer as accepted from scan_events where invitation_id=${invitationId}`;
      expect(counts).toEqual({ reported: 2, accepted: 1 });
      const [counter] =
        await tx`select allowance,admitted_people from admission_counters where invitation_id=${invitationId}`;
      expect(counter).toEqual({ allowance: 1, admitted_people: 1 });
      await expect(
        tx.savepoint(async (sp) => {
          await sp`delete from registered_devices where id=${deviceId}`;
        }),
      ).rejects.toMatchObject({ code: "23503" });
      await expect(
        tx.savepoint(async (sp) => {
          await sp`delete from staff where id=${staffId}`;
        }),
      ).rejects.toMatchObject({ code: "23503" });
    });
  }, 15_000);

  it.runIf(process.env.ADMISSION_SCHEMA_PROPOSAL === "1")(
    "rejects bulk evidence removal and source truncation",
    async () => {
      // Only exercise TRUNCATE against a private, rolled-back proposal schema, never public data.
      await storageTransaction(async (tx) => {
        const invitationId = randomUUID();
        await tx`insert into invitations(id,token,status) values (${invitationId},${randomUUID().replaceAll("-", "")},'rsvp_yes')`;
        await tx`insert into rsvps(invitation_id,attending,count_attending) values (${invitationId},true,1)`;
        await tx`insert into admission_counters(invitation_id,allowance,admitted_people) values (${invitationId},1,0)`;
        for (const table of ["scan_events", "admission_counters", "rsvps", "guests"]) {
          await expect(
            tx.savepoint(async (sp) => {
              // Fixed allowlist; CASCADE includes only foreign-key targets in this isolated schema.
              await sp.unsafe(`truncate table "${table}" cascade`);
            }),
          ).rejects.toMatchObject({ code: "42501" });
        }
        await expect(
          tx.savepoint(async (sp) => {
            await sp`delete from admission_counters where invitation_id=${invitationId}`;
          }),
        ).rejects.toMatchObject({ code: "42501" });
        expect(await tx`select invitation_id from admission_counters`).toHaveLength(1);
      });
    },
    15_000,
  );

  it.runIf(process.env.ADMISSION_SCHEMA_PROPOSAL === "1")(
    "serializes two transactions competing for the last admission",
    async () => {
      // A separate committed synthetic schema is needed for two connections to see the fixture.
      // Its random name is created here and removed here; public application tables are untouched.
      const namespace = "admission_test_" + randomUUID().replaceAll("-", "");
      const invitationId = randomUUID(),
        staffId = randomUUID(),
        deviceId = randomUUID();
      const enter = async (tx: TransactionSql) => {
        await tx.unsafe(`set local search_path to "${namespace}", pg_catalog`);
        await tx`select id from invitations where id=${invitationId} for update`;
        await tx`insert into scan_events(client_event_id,invitation_id,staff_id,device_id,reported_at,reported_result,result,reported_people,admitted_people,source)
        values (${randomUUID()},${invitationId},${staffId},${deviceId},'2026-12-19T12:00:00Z','valid','valid',1,1,'online')`;
      };
      const firstReady = Promise.withResolvers<void>();
      const releaseFirst = Promise.withResolvers<void>();
      const secondStarted = Promise.withResolvers<void>();
      let transactions: Promise<unknown>[] = [];
      try {
        await db.begin(async (tx) => {
          await installProposal(tx, namespace);
          await tx`insert into staff(id,name,role) values (${staffId},'Synthetic gate','gate')`;
          await tx`insert into registered_devices(id,name,role) values (${deviceId},'Synthetic scanner','gate')`;
          await tx`insert into invitations(id,token,status) values (${invitationId},${randomUUID().replaceAll("-", "")},'rsvp_yes')`;
          await tx`insert into rsvps(invitation_id,attending,count_attending) values (${invitationId},true,1)`;
        });
        const first = db.begin(async (tx) => {
          await enter(tx);
          firstReady.resolve();
          await releaseFirst.promise;
        });
        // Observe rejection immediately so a connection failure cannot strand the synchronization.
        void first.catch((error: unknown) => firstReady.reject(error));
        transactions = [first];
        await firstReady.promise;
        const second = db.begin(async (tx) => {
          secondStarted.resolve();
          await enter(tx);
        });
        void second.catch((error: unknown) => secondStarted.reject(error));
        transactions.push(second);
        await secondStarted.promise;
        releaseFirst.resolve();
        const outcomes = await Promise.allSettled(transactions);
        expect(outcomes[0]?.status).toBe("fulfilled");
        expect(outcomes[1]).toMatchObject({ status: "rejected", reason: { code: "23514" } });
        await db.begin(async (tx) => {
          await tx.unsafe(`set local search_path to "${namespace}", pg_catalog`);
          expect(await tx`select id from scan_events`).toHaveLength(1);
          expect(await tx`select allowance,admitted_people from admission_counters`).toEqual([
            { allowance: 1, admitted_people: 1 },
          ]);
        });
      } finally {
        releaseFirst.resolve();
        await Promise.allSettled(transactions);
        await db.unsafe(`drop schema if exists "${namespace}" cascade`);
      }
    },
    15_000,
  );

  for (const legacy of [false, true]) {
    it.runIf(process.env.ADMISSION_SCHEMA_PROPOSAL === "1")(
      `preserves populated ${legacy ? "bootstrap" : "current"} records and retains excess reports`,
      async () => {
        const invitationA = randomUUID(),
          invitationB = randomUUID(),
          staffId = randomUUID();
        const knownDevice = randomUUID();
        let original: unknown;
        const snapshot = async (tx: TransactionSql) => ({
          invitations: await tx`select to_jsonb(i) as row from invitations i order by id`,
          guests: await tx`select to_jsonb(g) as row from guests g order by id`,
          replies: await tx`select to_jsonb(r) as row from rsvps r order by id`,
          scans: await tx`select to_jsonb(c) as row from check_ins c order by id`,
        });
        await storageTransaction(
          async (tx) => {
            expect(await snapshot(tx)).toEqual(original);
            const events =
              await tx`select reported_people,admitted_people,conflict,device_id,source from scan_events order by reported_at`;
            expect(events).toHaveLength(3);
            expect(events.map((event) => event.reported_people)).toEqual([1, 1, 1]);
            expect(events.map((event) => event.admitted_people)).toEqual(
              legacy ? [1, 1, 0] : [1, 0, 0],
            );
            expect(events.map((event) => event.conflict)).toEqual(
              legacy ? [false, false, true] : [false, true, true],
            );
            expect(events.map((event) => event.device_id)).toEqual([knownDevice, null, null]);
            expect(events.every((event) => event.source === "legacy")).toBe(true);
            const [counter] =
              await tx`select allowance,admitted_people from admission_counters where invitation_id=${invitationA}`;
            expect(counter).toMatchObject({
              allowance: legacy ? 2 : 1,
              admitted_people: legacy ? 2 : 1,
            });
            const [declined] =
              await tx`select allowance,admitted_people from admission_counters where invitation_id=${invitationB}`;
            expect(declined).toMatchObject({ allowance: 0, admitted_people: 0 });
          },
          {
            legacy,
            beforeBackfill: async (tx) => {
              await tx`insert into staff(id,name,role) values (${staffId},'Synthetic legacy gate','gate')`;
              await tx`insert into registered_devices(id,name,role) values (${knownDevice},'Known historical scanner','gate')`;
              if (legacy) {
                await tx`insert into invitations(id,code,household_name) values (${invitationA},'legacy-a','Synthetic A'),(${invitationB},'legacy-b','Synthetic B')`;
                await tx`insert into rsvps(invitation_id,status) values (${invitationA},'attending'),(${invitationB},'declined')`;
              } else {
                await tx`insert into invitations(id,token,status) values (${invitationA},${randomUUID().replaceAll("-", "")},'rsvp_yes'),(${invitationB},${randomUUID().replaceAll("-", "")},'rsvp_no')`;
                await tx`insert into rsvps(invitation_id,attending,count_attending) values (${invitationA},true,1),(${invitationB},false,0)`;
              }
              for (const index of [0, 1, 2]) {
                const guest = randomUUID(),
                  invitation = index < 2 ? invitationA : invitationB;
                if (legacy) {
                  await tx`insert into guests(id,invitation_id,first_name,last_name,qr_token) values (${guest},${invitation},'Legacy',${String(index)},${randomUUID()})`;
                } else {
                  await tx`insert into guests(id,invitation_id,name) values (${guest},${invitation},${"Legacy " + index})`;
                }
                await tx`insert into check_ins(guest_id,staff_id,checked_in_at,device_id,client_event_id) values (${guest},${index === 2 ? null : staffId},${new Date(Date.UTC(2026, 11, 19, 12, index))},${index === 0 ? knownDevice : "legacy device / unregistered"},${randomUUID()})`;
              }
              original = await snapshot(tx);
            },
          },
        );
      },
      15_000,
    );
  }
});
