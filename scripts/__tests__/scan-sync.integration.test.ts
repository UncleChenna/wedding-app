import { randomBytes, randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { assertDatabaseTarget } from "../database-target";
import * as schema from "../../src/modules/shared/server/db/schema";
import type { Db } from "../../src/modules/shared/server/db/client";
import type { ScanEventAck, ScanEventReport } from "../../src/modules/checkin/lib/scan-sync";
import type {
  GateActor,
  reconcileScanBatch as Reconcile,
} from "../../src/modules/checkin/server/reconcile-scans";
import type { scanSyncResponse as Respond } from "../../src/modules/checkin/server/scan-sync-response";

/**
 * TICKET-173 against the real database. scan_events is append-only, so each test commits its own
 * fresh party, staff member and devices on the local stack; `pnpm db:reset` clears them.
 */
let sql: Sql;
let database: Db;
let reconcile: typeof Reconcile;
let respond: typeof Respond;
let staffId: string;
const tag = "TICKET-173 fixture";

async function device(): Promise<GateActor> {
  const id: string = randomUUID();
  await sql`insert into registered_devices(id, name, role, registered_by_staff_id)
    values (${id}, ${tag + " scanner"}, 'gate', ${staffId})`;
  return { staffId, deviceId: id };
}
async function party(count: number) {
  const [row] = await sql<{ id: string }[]>`insert into invitations(token, household_name, status)
    values (${randomBytes(32).toString("base64url")}, ${tag}, 'rsvp_yes') returning id`;
  if (!row) throw new Error("no invitation");
  await sql`insert into rsvps(invitation_id, attending, count_attending) values (${row.id}, true, ${count})`;
  return row.id;
}
function scan(invitationId: string | null, people = 4): ScanEventReport {
  return {
    clientEventId: randomUUID(),
    invitationId,
    passVersion: 1,
    reportedAt: new Date(Date.now() - 60_000).toISOString(),
    reportedResult: "valid",
    reportedPeople: people,
  };
}
async function stored(invitationId: string) {
  const [events] = await sql<
    { reported: number; admitted: number; conflicts: number; rows: number }[]
  >`
    select coalesce(sum(reported_people), 0)::int as reported, coalesce(sum(admitted_people), 0)::int as admitted,
      count(*) filter (where conflict)::int as conflicts, count(*)::int as rows
    from scan_events where invitation_id = ${invitationId}`;
  const [counter] = await sql<{ admitted: number }[]>`
    select admitted_people as admitted from admission_counters where invitation_id = ${invitationId}`;
  return { ...events, counter: counter?.admitted ?? 0 };
}
const statuses = (acks: ScanEventAck[]) => acks.map((ack) => ack.status);

describe.runIf(process.env.RUN_SCAN_SYNC_DB_TESTS === "1")("offline scan reconciliation", () => {
  beforeAll(async () => {
    process.loadEnvFile(".env.local");
    const url = process.env.DATABASE_URL ?? "";
    assertDatabaseTarget(url, { localOnly: true });
    sql = postgres(url, { max: 8, connect_timeout: 10, onnotice: () => {} });
    database = drizzle(sql, { schema }) as unknown as Db;
    reconcile = (await import("../../src/modules/checkin/server/reconcile-scans"))
      .reconcileScanBatch;
    respond = (await import("../../src/modules/checkin/server/scan-sync-response"))
      .scanSyncResponse;
    const [member] = await sql<{ id: string }[]>`insert into staff(name, role)
      values (${tag + " gate"}, 'gate') returning id`;
    if (!member) throw new Error("no staff");
    staffId = member.id;
  });
  afterAll(async () => {
    if (sql) await sql.end({ timeout: 1 });
  });

  it("treats an identical retry as a no-op and refuses the same id with a different scan", async () => {
    const actor = await device();
    const invitation = await party(4);
    const first = scan(invitation, 2);
    expect(statuses((await reconcile(database, actor, [first])).acks)).toEqual(["recorded"]);
    const again = await reconcile(database, actor, [first]);
    expect(again.acks).toEqual([
      {
        clientEventId: first.clientEventId,
        status: "duplicate",
        result: "valid",
        admitted: 2,
        conflict: false,
      },
    ]);
    const altered = await reconcile(database, actor, [{ ...first, reportedPeople: 3 }]);
    expect(statuses(altered.acks)).toEqual(["rejected"]);
    const otherDevice = await reconcile(database, await device(), [first]);
    expect(statuses(otherDevice.acks)).toEqual(["rejected"]);
    expect(await stored(invitation)).toEqual({
      reported: 2,
      admitted: 2,
      conflicts: 0,
      rows: 1,
      counter: 2,
    });
  });

  it("keeps eight reported admissions from two offline devices but counts only four", async () => {
    const [north, south] = [await device(), await device()];
    const invitation = await party(4);
    const results = await Promise.all([
      reconcile(database, north, [scan(invitation)]),
      reconcile(database, south, [scan(invitation)]),
    ]);
    const acks = results.flatMap((result) => result.acks);
    expect(statuses(acks)).toEqual(["recorded", "recorded"]);
    expect(acks.filter((ack) => ack.status === "recorded" && ack.conflict)).toHaveLength(1);
    expect(await stored(invitation)).toEqual({
      reported: 8,
      admitted: 4,
      conflicts: 1,
      rows: 2,
      counter: 4,
    });
  });

  it("never over-admits under many concurrent partial uploads", async () => {
    const invitation = await party(5);
    const actors = await Promise.all(Array.from({ length: 6 }, () => device()));
    await Promise.all(actors.map((actor) => reconcile(database, actor, [scan(invitation, 2)])));
    const totals = await stored(invitation);
    expect(totals).toMatchObject({ reported: 12, admitted: 5, rows: 6, counter: 5 });
    expect(totals.conflicts).toBeGreaterThanOrEqual(1);
  });

  it("stores one row when the same upload races itself", async () => {
    const actor = await device();
    const invitation = await party(4);
    const event = scan(invitation, 3);
    const results = await Promise.all([
      reconcile(database, actor, [event]),
      reconcile(database, actor, [event]),
      reconcile(database, actor, [event]),
    ]);
    expect(statuses(results.flatMap((result) => result.acks)).sort()).toEqual([
      "duplicate",
      "duplicate",
      "recorded",
    ]);
    expect(await stored(invitation)).toMatchObject({ rows: 1, admitted: 3, counter: 3 });
  });

  it("keeps an unknown invitation's scan as flagged evidence and matches its retry", async () => {
    const actor = await device();
    const unknown = scan(randomUUID(), 2);
    const first = await reconcile(database, actor, [unknown]);
    expect(first.acks).toEqual([
      {
        clientEventId: unknown.clientEventId,
        status: "recorded",
        result: "invalid",
        admitted: 0,
        conflict: true,
      },
    ]);
    expect(statuses((await reconcile(database, actor, [unknown])).acks)).toEqual(["duplicate"]);
  });

  it("never acknowledges a write that did not commit, and keeps the rest of the batch", async () => {
    const actor = await device();
    const invitation = await party(4);
    const events = [scan(invitation, 1), scan(invitation, 1), scan(invitation, 1)];
    let call = 0;
    // The second event's transaction stores its row, then fails before commit.
    const flaky: Pick<Db, "transaction"> = {
      transaction: ((run: Parameters<Db["transaction"]>[0]) =>
        database.transaction(async (tx) => {
          const value = await run(tx);
          if (++call === 2) throw new Error("synthetic commit failure");
          return value;
        })) as Db["transaction"],
    };
    const result = await reconcile(flaky, actor, events);
    expect(statuses(result.acks)).toEqual(["recorded", "retry", "recorded"]);
    expect(await stored(invitation)).toMatchObject({ rows: 2, admitted: 2, counter: 2 });
    const [missing] =
      await sql`select 1 from scan_events where client_event_id = ${events[1]?.clientEventId ?? ""}`;
    expect(missing).toBeUndefined();
    // The device resends what was not acknowledged.
    expect(statuses((await reconcile(database, actor, events)).acks)).toEqual([
      "duplicate",
      "recorded",
      "duplicate",
    ]);
    expect(await stored(invitation)).toMatchObject({ rows: 3, admitted: 3, counter: 3 });
  });

  it("stops storing once the device is revoked and leaves the scans on the device", async () => {
    const actor = await device();
    const invitation = await party(4);
    await sql`update registered_devices set revoked_at = now() where id = ${actor.deviceId}`;
    const result = await reconcile(database, actor, [scan(invitation, 1), scan(invitation, 1)]);
    expect(result.revoked).toBe(true);
    expect(statuses(result.acks)).toEqual(["retry", "retry"]);
    expect(await stored(invitation)).toMatchObject({ rows: 0, counter: 0 });
  });

  it("replays the same uploaded batch twice over HTTP without counting it twice", async () => {
    const [north, south] = [await device(), await device()];
    const invitation = await party(4);
    const batches = new Map([
      [north, [scan(invitation, 2), scan(invitation, 2)]],
      [south, [scan(invitation, 4)]],
    ]);
    const upload = (actor: GateActor) =>
      respond(
        new Request("http://localhost/api/checkin/sync", {
          method: "POST",
          body: JSON.stringify({ events: batches.get(actor) }),
        }),
        {
          authorize: async () => actor,
          reconcile: (who, events) => reconcile(database, who, events),
        },
      ).then(async (response) => {
        expect(response.status).toBe(200);
        return ((await response.json()) as { acks: ScanEventAck[] }).acks;
      });
    expect(statuses(await upload(north))).toEqual(["recorded", "recorded"]);
    expect(statuses(await upload(north))).toEqual(["duplicate", "duplicate"]);
    expect(statuses(await upload(south))).toEqual(["recorded"]);
    expect(statuses(await upload(south))).toEqual(["duplicate"]);
    expect(await stored(invitation)).toEqual({
      reported: 8,
      admitted: 4,
      conflicts: 1,
      rows: 3,
      counter: 4,
    });
  });
});
