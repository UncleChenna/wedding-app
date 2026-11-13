/**
 * Wedding-day load test (TICKET-137): every attending invitation scanned at the gate across three
 * scanner devices, and 30 tables ordering inside one window, against a running production build.
 * It measures what the PRD promises (scan to result < 1 s, order to board < 2 s, p95), then checks
 * in the database that no admission or order was lost, and writes a Markdown report.
 *
 *   pnpm db:seed --profile load          # 350 guests, 30 tables (local; never real guest data)
 *   pnpm build && pnpm start             # in another terminal, with the same env as below
 *   pnpm load:test                       # compressed: gate 3 min, orders 1 min
 *   pnpm load:test --gate-minutes 45 --order-minutes 5   # the PRD protocol
 *
 * Needs DATABASE_URL, STAFF_SESSION_SECRET and GATE_SIGNING_KEY_ID/GATE_SIGNING_PRIVATE_KEY, the
 * same values the server uses. Staging: add --staging and --base-url https://…; DATABASE_URL must
 * then point at isolated staging data seeded with the load profile.
 */
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { parseArgs } from "node:util";
import postgres from "postgres";
import { assertDatabaseTarget } from "../database-target";
import { loadGateSigningKeys, signGatePass } from "../../src/modules/checkin/server/signing";
import { gatePassUrl } from "../../src/modules/checkin/lib/pass-url";
import { hashStaffPin } from "../../src/modules/shared/server/staff-pin";
import { createStaffDeviceCookie } from "../../src/modules/shared/server/staff-device-cookie";
import { signStaffSession } from "../../src/modules/shared/server/staff-session";
import {
  STAFF_DEVICE_COOKIE,
  STAFF_SESSION_COOKIE,
} from "../../src/modules/shared/server/staff-cookies";
import { report, schedule, summarize, type Sample } from "./stats";

const { values: args } = parseArgs({
  options: {
    "base-url": { type: "string" },
    "gate-minutes": { type: "string", default: "3" },
    "order-minutes": { type: "string", default: "1" },
    scanners: { type: "string", default: "3" },
    tables: { type: "string", default: "30" },
    report: { type: "string" },
    staging: { type: "boolean", default: false },
  },
});

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const databaseUrl = process.env.DATABASE_URL ?? "";
assertDatabaseTarget(databaseUrl, { localOnly: !args.staging });
const secret = process.env.STAFF_SESSION_SECRET ?? "";
if (!/^[0-9a-f]{64}$/i.test(secret)) throw new Error("STAFF_SESSION_SECRET must be 64 hex chars.");
const key = Buffer.from(secret, "hex");
const gateKeys = loadGateSigningKeys();
if (!gateKeys.ok) throw new Error(`Gate signing keys are ${gateKeys.error}.`);

function localBaseUrl() {
  if (!existsSync(".harness/worktree.json")) return "http://localhost:3000";
  const meta = JSON.parse(readFileSync(".harness/worktree.json", "utf8")) as { devPort: number };
  return `http://localhost:${meta.devPort}`;
}
const baseUrl = new URL(args["base-url"] ?? localBaseUrl()).origin;
const gateWindowMs = Number(args["gate-minutes"]) * 60_000;
const orderWindowMs = Number(args["order-minutes"]) * 60_000;
const scannerCount = Number(args.scanners);
const tableCount = Number(args.tables);
const tag = `TICKET-137 load ${new Date().toISOString()}`;

const sql = postgres(databaseUrl, { max: 4, onnotice: () => {} });
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));

type Device = { staffId: string; cookie: string };

/** A real staff member and registered device with a live PIN, signed in the way sign-in does. */
async function device(role: "gate" | "kitchen" | "bar", index: number): Promise<Device> {
  const staffId = randomUUID();
  const pinHash = await hashStaffPin(String(100000 + Math.floor(Math.random() * 900000)));
  await sql`insert into staff(id, name, role, pin_hash, pin_issued_at, pin_expires_at)
    values (${staffId}, ${`${tag} ${role} ${index}`}, ${role}, ${pinHash},
      now() - interval '1 minute', now() + interval '1 day')`;
  const created = createStaffDeviceCookie(key);
  await sql`insert into registered_devices(id, name, role, registered_by_staff_id)
    values (${created.id}, ${`Load ${role} ${index}`}, ${role}, ${staffId})`;
  const session = signStaffSession(
    { staffId, role, credentialVersion: 1 },
    created.id,
    new Date(Date.now() + 6 * 60 * 60_000),
    key,
  );
  return {
    staffId,
    cookie: `${STAFF_DEVICE_COOKIE}=${created.cookie}; ${STAFF_SESSION_COOKIE}=${session}`,
  };
}

async function post(path: string, body: unknown, cookie?: string) {
  const started = performance.now();
  try {
    const response = await fetch(baseUrl + path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: baseUrl,
        ...(cookie ? { Cookie: cookie } : {}),
      },
      body: JSON.stringify(body),
    });
    const json = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    return { ms: performance.now() - started, status: response.status, json };
  } catch {
    return { ms: performance.now() - started, status: 0, json: {} as Record<string, unknown> };
  }
}

type Pass = { invitationId: string; qr: string; people: number };

async function runGate(passes: Pass[], scanners: Device[]) {
  const reads: Sample[] = [];
  const admits: Sample[] = [];
  let admittedPeople = 0;
  const lanes = scanners.map((_, lane) =>
    passes.filter((__, index) => index % scanners.length === lane),
  );
  const started = performance.now();
  await Promise.all(
    lanes.map(async (lane, laneIndex) => {
      const scanner = scanners[laneIndex];
      if (!scanner) return;
      const starts = schedule(lane.length, gateWindowMs);
      for (const [index, pass] of lane.entries()) {
        await sleep((starts[index] ?? 0) - (performance.now() - started));
        const read = await post("/api/checkin/read", { qr: pass.qr }, scanner.cookie);
        const readState = String(read.json.state ?? `http-${read.status}`);
        reads.push({
          ms: read.ms,
          ok: read.status === 200 && readState === "valid",
          outcome: readState,
        });
        if (readState !== "valid") continue;
        const admit = await post(
          "/api/checkin/admit",
          { clientEventId: randomUUID(), qr: pass.qr, people: pass.people },
          scanner.cookie,
        );
        const admitState = String(admit.json.state ?? `http-${admit.status}`);
        admits.push({
          ms: admit.ms,
          ok: admit.status === 200 && admitState === "recorded",
          outcome: admitState,
        });
        if (admitState === "recorded") admittedPeople += Number(admit.json.people ?? 0);
      }
    }),
  );
  return { reads, admits, admittedPeople };
}

type BoardTicket = { orderId: string };

async function runOrders(
  tables: number[],
  menu: { kitchen: string; bar: string },
  boards: { kitchen: Device; bar: Device },
) {
  const submits: Sample[] = [];
  const toBoard: Sample[] = [];
  const created = new Set<string>();
  const sentAt = new Map<string, number>();
  const seen = new Map<string, Set<"kitchen" | "bar">>();
  let polling = true;

  // One poller per board, as fast as a refetch after each Realtime notice would be.
  const poll = async (station: "kitchen" | "bar") => {
    while (polling) {
      try {
        const response = await fetch(`${baseUrl}/api/${station}/board`, {
          headers: { Cookie: boards[station].cookie },
          cache: "no-store",
        });
        const board = (await response.json()) as { tickets?: BoardTicket[] };
        const now = performance.now();
        for (const ticket of board.tickets ?? []) {
          const sent = sentAt.get(ticket.orderId);
          const stations = seen.get(ticket.orderId) ?? new Set();
          if (sent === undefined || stations.has(station)) continue;
          stations.add(station);
          seen.set(ticket.orderId, stations);
          toBoard.push({ ms: now - sent, ok: true, outcome: `on ${station} board` });
        }
      } catch {
        // A failed poll is retried; a ticket that never appears is counted as missing below.
      }
      await sleep(100);
    }
  };
  const pollers = [poll("kitchen"), poll("bar")];

  const starts = schedule(tables.length, orderWindowMs);
  const started = performance.now();
  await Promise.all(
    tables.map(async (table, index) => {
      await sleep((starts[index] ?? 0) - (performance.now() - started));
      const sent = performance.now();
      const body = {
        clientRequestId: randomUUID(),
        table,
        items: [
          { menuItemId: menu.kitchen, quantity: 1 },
          { menuItemId: menu.bar, quantity: 1 },
        ],
        note: "",
      };
      const result = await post("/api/orders", body);
      const status = String(result.json.status ?? `http-${result.status}`);
      submits.push({ ms: result.ms, ok: status === "created", outcome: status });
      const orderId = result.json.orderId;
      if (status === "created" && typeof orderId === "string") {
        created.add(orderId);
        sentAt.set(orderId, sent);
      }
    }),
  );
  // Give the last orders up to 10 s to reach both boards before calling them missing.
  const deadline = performance.now() + 10_000;
  while (performance.now() < deadline) {
    if ([...created].every((id) => seen.get(id)?.size === 2)) break;
    await sleep(100);
  }
  polling = false;
  await Promise.all(pollers);
  for (const id of created)
    for (const station of ["kitchen", "bar"] as const)
      if (!seen.get(id)?.has(station))
        toBoard.push({ ms: 10_000, ok: false, outcome: `missing from ${station} board` });
  return { submits, toBoard, created };
}

async function main() {
  const [settings] = await sql<
    { date: string | null; zone: string | null; open: boolean; cooldown: number }[]
  >`select event_date::text as date, time_zone as zone, ordering_open as open,
      order_cooldown_seconds as cooldown from event_settings where id = 1`;
  if (!settings) throw new Error("No event settings: seed the database first.");
  const staffIds: string[] = [];
  try {
    // Staff sessions end after the event day, and orders need ordering open.
    await sql`update event_settings set event_date = (now() + interval '1 day')::date,
      time_zone = coalesce(time_zone, 'Africa/Lagos'), ordering_open = true where id = 1`;

    const scanners = await Promise.all(
      Array.from({ length: scannerCount }, (_, index) => device("gate", index + 1)),
    );
    const boards = { kitchen: await device("kitchen", 1), bar: await device("bar", 1) };
    staffIds.push(...scanners.map((s) => s.staffId), boards.kitchen.staffId, boards.bar.staffId);

    const invitations = await sql<
      { id: string; version: number; people: number; admitted: number }[]
    >`select i.id, i.token_version as version, r.count_attending as people,
        coalesce(a.admitted_people, 0) as admitted
      from invitations i
      join rsvps r on r.invitation_id = i.id
      left join admission_counters a on a.invitation_id = i.id
      where i.status = 'rsvp_yes' and r.attending and r.count_attending > 0
      order by random()`;
    if (!gateKeys.ok) return;
    const passes: Pass[] = invitations
      .filter((row) => row.admitted < row.people)
      .map((row) => ({
        invitationId: row.id,
        qr: gatePassUrl(
          baseUrl,
          signGatePass({ invitationId: row.id, tokenVersion: row.version }, gateKeys.value),
        ),
        people: row.people - row.admitted,
      }));
    const alreadyIn = invitations.reduce((sum, row) => sum + Math.min(row.admitted, row.people), 0);
    const [beforeAdmitted] = await sql<{ n: number }[]>`
      select coalesce(sum(admitted_people), 0)::int as n from admission_counters`;

    const tables = (
      await sql<{ number: number }[]>`select number from tables order by number limit ${tableCount}`
    ).map((row) => row.number);
    const [kitchenItem] = await sql<{ id: string }[]>`select id from menu_items
      where station = 'kitchen' and is_available order by sort_order, name limit 1`;
    const [barItem] = await sql<{ id: string }[]>`select id from menu_items
      where station = 'bar' and is_available order by sort_order, name limit 1`;
    if (!kitchenItem || !barItem) throw new Error("Need an available kitchen and bar menu item.");

    console.log(
      `Gate: ${passes.length} passes (${passes.reduce((s, p) => s + p.people, 0)} people) over ` +
        `${args["gate-minutes"]} min on ${scannerCount} scanners. Orders: ${tables.length} tables ` +
        `over ${args["order-minutes"]} min. Target ${baseUrl}`,
    );
    // The PRD has both happen on the day; run them together so the server carries both loads.
    const [gate, orders] = await Promise.all([
      runGate(passes, scanners),
      runOrders(tables, { kitchen: kitchenItem.id, bar: barItem.id }, boards),
    ]);

    const [afterAdmitted] = await sql<{ n: number }[]>`
      select coalesce(sum(admitted_people), 0)::int as n from admission_counters`;
    const storedOrders = orders.created.size
      ? ((
          await sql<{ n: number }[]>`select count(*)::int as n from orders
            where id in ${sql([...orders.created])}`
        )[0]?.n ?? 0)
      : 0;

    const result = report({
      title: `Load test: gate and table ordering (${new Date().toISOString().slice(0, 10)})`,
      environment: [
        `Target: ${args.staging ? "staging" : "local production build"} (${baseUrl})`,
        `Gate: ${passes.length} passes for ${passes.reduce((s, p) => s + p.people, 0)} people, ${scannerCount} scanners, ${args["gate-minutes"]}-minute window (PRD: 45)`,
        `Ordering: ${tables.length} tables, one food+drink order each, ${args["order-minutes"]}-minute window (PRD: 5), run alongside the gate`,
        "Order to board: time from sending the order to its ticket appearing on the kitchen and bar board endpoints, polled every 100 ms",
        `Guests already admitted before the run: ${alreadyIn}`,
        "Data: seeded load profile (`pnpm db:seed --profile load`); no real guest data",
      ],
      targets: [
        { name: "Scan to result (read)", summary: summarize(gate.reads), p95LimitMs: 1000 },
        { name: "Admit", summary: summarize(gate.admits), p95LimitMs: 1000 },
        { name: "Order submit", summary: summarize(orders.submits), p95LimitMs: 2000 },
        { name: "Order to board", summary: summarize(orders.toBoard), p95LimitMs: 2000 },
      ],
      reconciliation: [
        {
          name: "People admitted (counters grew by what scanners recorded)",
          expected: gate.admittedPeople,
          actual: (afterAdmitted?.n ?? 0) - (beforeAdmitted?.n ?? 0),
        },
        {
          name: "Orders stored (of those created)",
          expected: orders.created.size,
          actual: storedOrders,
        },
      ],
    });
    const path =
      args.report ?? `docs/audits/TICKET-137-load-${new Date().toISOString().slice(0, 10)}.md`;
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, result.markdown);
    console.log(result.markdown);
    console.log(`Report: ${path}`);
    process.exitCode = result.passed ? 0 : 1;
  } finally {
    // Scan events keep their staff for the record, so revoke the load staff rather than delete them.
    if (staffIds.length)
      await sql`update staff set pin_hash = null, pin_issued_at = null, pin_expires_at = null,
        revoked_at = now(), credential_version = credential_version + 1 where id in ${sql(staffIds)}`;
    await sql`update event_settings set event_date = ${settings.date}, time_zone = ${settings.zone},
      ordering_open = ${settings.open} where id = 1`;
    await sql.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Load test failed.");
  process.exitCode = 1;
});
