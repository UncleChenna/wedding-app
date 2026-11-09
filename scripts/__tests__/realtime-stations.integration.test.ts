import { randomInt, randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  createStationClient,
  type StationClient,
} from "../../src/modules/shared/lib/station-client";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { assertDatabaseTarget } from "../database-target";
import { setOrderingOpen } from "../../e2e/support/ordering-open";
import * as schema from "../../src/modules/shared/server/db/schema";
import type { Db } from "../../src/modules/shared/server/db/client";
import type { createOrder as CreateOrder } from "../../src/modules/ordering/server/create-order";
import type { RealtimeToken, Station } from "../../src/modules/shared/lib/realtime-channels";
import {
  subscribeStation,
  type StationChannelStatus,
} from "../../src/modules/shared/lib/station-channel";
import { mintStationToken } from "../../src/modules/shared/server/realtime-token";

/**
 * TICKET-033 against this worktree's local Supabase stack (Realtime included):
 * RUN_REALTIME_DB_TESTS=1 vitest run scripts/__tests__/realtime-stations.integration.test.ts
 */
let sql: Sql;
let database: Db;
let createOrder: typeof CreateOrder;
let restoreOrdering: (() => Promise<void>) | undefined;
const clients: SupabaseClient[] = [];
const stops: (() => void)[] = [];
const tag = "TICKET-033 fixture " + randomInt(100000, 900000);
const menu = { meal: randomUUID(), drink: randomUUID() };
const tableIds: string[] = [];

function client() {
  const created = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  clients.push(created);
  return created;
}
const stationClients: StationClient[] = [];
function stationClient() {
  const created = createStationClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
  );
  stationClients.push(created);
  return created;
}
const secret = () => process.env.SUPABASE_JWT_SECRET ?? "";
const tokenFor = (station: Station) =>
  mintStationToken({ station, deviceId: randomUUID() }, secret());

type Received = { event: string; payload: unknown; at: number };
/** A station screen: the real helper on a real client, recording events, resyncs and status. */
function screen(station: Station, token: () => RealtimeToken = () => tokenFor(station)) {
  const received: Received[] = [];
  const statuses: StationChannelStatus[] = [];
  let resyncs = 0;
  const supabase = stationClient();
  const stop = subscribeStation({
    station,
    client: supabase,
    onEvent: (event, payload) => received.push({ event, payload, at: Date.now() }),
    onResync: () => {
      resyncs += 1;
    },
    onStatus: (status) => statuses.push(status),
    fetchToken: async () => ({ token: token() }),
  });
  stops.push(stop);
  return { supabase, received, statuses, resyncs: () => resyncs };
}
async function until(check: () => boolean, ms = 5_000) {
  const start = Date.now();
  while (!check()) {
    if (Date.now() - start > ms) throw new Error("timed out");
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
}
/** Subscribes raw, outside the helper, and reports the join result. */
function join(supabase: SupabaseClient | StationClient, topic: string) {
  return new Promise<string>((resolve) => {
    const timer = setTimeout(() => resolve("NO_ANSWER"), 6_000);
    const channel = (supabase as StationClient).channel(topic, { config: { private: true } });
    channel.subscribe((status) => {
      if (status !== "SUBSCRIBED" && status !== "CHANNEL_ERROR" && status !== "TIMED_OUT") return;
      clearTimeout(timer);
      void (supabase as StationClient).removeChannel(channel);
      resolve(status);
    });
  });
}
/** Each order gets its own table, so per-table limits and cooldowns never interfere. */
async function order(items: { menuItemId: string; quantity: number }[], note = "") {
  const table = randomInt(100000, 900000);
  const [row] = await sql<{ id: string }[]>`insert into tables(number, name, capacity)
    values (${table}, ${tag}, 8) returning id`;
  if (row) tableIds.push(row.id);
  const result = await createOrder(database, {
    clientRequestId: randomUUID(),
    table,
    items,
    note,
  });
  if (result.status !== "created") throw new Error(`order not created: ${JSON.stringify(result)}`);
  return result.orderId;
}

describe.runIf(process.env.RUN_REALTIME_DB_TESTS === "1")(
  "station realtime",
  { timeout: 30_000 },
  () => {
    beforeAll(async () => {
      process.loadEnvFile(".env.local");
      const url = process.env.DATABASE_URL ?? "";
      assertDatabaseTarget(url, { localOnly: true });
      expect(secret().length).toBeGreaterThanOrEqual(32);
      sql = postgres(url, { max: 4, connect_timeout: 10, onnotice: () => {} });
      restoreOrdering = await setOrderingOpen(sql, true);
      database = drizzle(sql, { schema }) as unknown as Db;
      createOrder = (await import("../../src/modules/ordering/server/create-order")).createOrder;
      await sql`insert into menu_items(id, name, category_v2, station, max_per_order, is_available) values
      (${menu.meal}, ${tag + " meal"}, 'meal', 'kitchen', 5, true),
      (${menu.drink}, ${tag + " drink"}, 'soft_drink', 'bar', 5, true)`;
    });
    afterAll(async () => {
      for (const stop of stops) stop();
      await Promise.all(clients.map((c) => c.removeAllChannels()));
      for (const c of clients) c.realtime.disconnect();
      for (const c of stationClients) c.disconnect();
      if (!sql) return;
      try {
        if (tableIds.length) await sql`delete from orders where table_id in ${sql(tableIds)}`;
        await sql`delete from menu_items where id in ${sql(Object.values(menu))}`;
        if (tableIds.length) await sql`delete from tables where id in ${sql(tableIds)}`;
      } finally {
        await restoreOrdering?.();
        await sql.end();
      }
    });

    it("delivers a new order to two kitchen screens within 2 seconds, and not to the bar", async () => {
      const [north, south, bar] = [screen("kitchen"), screen("kitchen"), screen("bar")];
      await until(() => [north, south, bar].every((s) => s.statuses.includes("live")));
      const sent = Date.now();
      const orderId = await order([{ menuItemId: menu.meal, quantity: 1 }]);
      await until(() => north.received.length > 0 && south.received.length > 0, 2_000);
      for (const kitchen of [north, south]) {
        const [message] = kitchen.received;
        expect(message?.event).toBe("order.changed");
        expect(message?.payload).toMatchObject({ orderId, status: "received" });
        expect(Object.keys(message?.payload ?? {}).sort()).toEqual([
          "orderId",
          "stationOrderId",
          "status",
        ]);
        expect((message?.at ?? Infinity) - sent).toBeLessThan(2_000);
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
      expect(bar.received).toEqual([]);
    });

    it("bar notifications contain only order identifiers and status, never free text", async () => {
      const bar = screen("bar");
      const kitchen = screen("kitchen");
      await until(() => [bar, kitchen].every((s) => s.statuses.includes("live")));
      const orderId = await order([{ menuItemId: menu.drink, quantity: 1 }], "No ice");
      await until(() => bar.received.length > 0, 2_000);
      const [message] = bar.received;
      expect(message?.event).toBe("order.changed");
      expect(message?.payload).toEqual({
        orderId,
        stationOrderId: expect.any(String),
        status: "received",
      });
      expect(JSON.stringify(message?.payload)).not.toContain("No ice");
      // Operational instructions persist for the authorized board reader, never the broadcast.
      const [persisted] = await sql<
        { notes: string }[]
      >`select notes from orders where id = ${orderId}`;
      expect(persisted?.notes).toBe("No ice");
      await new Promise((resolve) => setTimeout(resolve, 500));
      expect(kitchen.received).toEqual([]);
    });

    it("refuses guests, other stations and forged tokens on a staff topic", async () => {
      expect(await join(client(), "station:kitchen")).toBe("CHANNEL_ERROR");
      // The same screen code, handed the wrong token, never goes live on the kitchen topic.
      const gateOnKitchen = screen("kitchen", () => tokenFor("gate"));
      const forged = screen("kitchen", () =>
        mintStationToken({ station: "kitchen", deviceId: "x" }, "y".repeat(40)),
      );
      const gate = screen("gate");
      await until(() => gate.statuses.includes("live"));
      await until(() => [gateOnKitchen, forged].every((s) => s.statuses.includes("reconnecting")));
      await order([{ menuItemId: menu.meal, quantity: 1 }]);
      await new Promise((resolve) => setTimeout(resolve, 1_000));
      for (const refused of [gateOnKitchen, forged]) {
        expect(refused.statuses).not.toContain("live");
        expect(refused.received).toEqual([]);
      }
    });

    it("after a dropped connection, rejoins and refetches so the missed order is not lost", async () => {
      const kitchen = screen("kitchen");
      await until(() => kitchen.statuses.includes("live"));
      const before = kitchen.resyncs();
      kitchen.supabase.disconnect();
      // Written while this screen is offline: no broadcast reaches it.
      const missed = await order([{ menuItemId: menu.meal, quantity: 2 }]);
      kitchen.supabase.connect();
      await until(
        () => kitchen.statuses.lastIndexOf("live") > kitchen.statuses.indexOf("reconnecting"),
        15_000,
      );
      expect(kitchen.statuses).toContain("reconnecting");
      // It refetched while down and again on rejoining.
      expect(kitchen.resyncs()).toBeGreaterThanOrEqual(before + 2);
      expect(
        kitchen.received.some((m) => (m.payload as { orderId?: string }).orderId === missed),
      ).toBe(false);
      // The refetch is what the board runs: its station's open tickets, which include the missed one.
      const open = await sql<{ order_id: string }[]>`select order_id from station_orders
        where station = 'kitchen' and status = 'received' and order_id = ${missed}`;
      expect(open).toHaveLength(1);
      // And it's live again afterwards.
      const after = await order([{ menuItemId: menu.meal, quantity: 1 }]);
      await until(
        () => kitchen.received.some((m) => (m.payload as { orderId?: string }).orderId === after),
        2_000,
      );
    });
  },
);
