import postgres, { type Sql, type TransactionSql } from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { assertDatabaseTarget } from "../database-target";

// TICKET-027 / ADR 0024. Runs against this worktree's seeded local Supabase stack:
// RUN_RLS_DB_TESTS=1 pnpm vitest run scripts/__tests__/rls-policies.integration.test.ts
const stations = ["gate", "kitchen", "bar"] as const;
let client: Sql;
const rollback = new Error("rollback RLS probe");

async function inRolledBack(work: (tx: TransactionSql) => Promise<void>) {
  try {
    await client.begin(async (tx) => {
      await work(tx);
      throw rollback;
    });
  } catch (error) {
    if (error !== rollback) throw error;
  }
}

async function actAs(tx: TransactionSql, role: "anon" | "authenticated", claims: object = {}) {
  await tx`select set_config('request.jwt.claims', ${JSON.stringify({ role, ...claims })}, true)`;
  await tx.unsafe(`set local role ${role}`);
}

const browserRoles: { label: string; role: "anon" | "authenticated"; claims?: object }[] = [
  { label: "anonymous key", role: "anon" },
  { label: "signed-in without a station", role: "authenticated", claims: { sub: "probe" } },
  ...stations.map((station) => ({
    label: `${station} staff`,
    role: "authenticated" as const,
    claims: { sub: "probe-device", staff_station: station },
  })),
];

describe.runIf(process.env.RUN_RLS_DB_TESTS === "1")("browser access (RLS)", () => {
  let tables: string[] = [];

  beforeAll(async () => {
    process.loadEnvFile(".env.local");
    const url = process.env.DATABASE_URL ?? "";
    assertDatabaseTarget(url, { localOnly: true });
    client = postgres(url, { max: 2, prepare: false, onnotice: () => undefined });
    tables = (
      await client<
        { name: string }[]
      >`select tablename as name from pg_tables where schemaname = 'public' order by 1`
    ).map((row) => row.name);
  });
  afterAll(async () => {
    if (client) await client.end();
  });

  it("starts from seeded data, so zero rows means refused rather than empty", async () => {
    expect(tables.length).toBeGreaterThan(15);
    const [guests] = await client<
      { count: number }[]
    >`select count(*)::int as count from guests where dietary_notes is not null`;
    expect(guests?.count).toBeGreaterThan(0);
  });

  it("has no browser policy on any public table", async () => {
    expect(
      await client`select tablename, policyname from pg_policies where schemaname = 'public'`,
    ).toEqual([]);
  });

  for (const actor of browserRoles) {
    it(`${actor.label}: reads, changes and deletes zero rows in every public table`, async () => {
      for (const table of tables) {
        await inRolledBack(async (tx) => {
          await actAs(tx, actor.role, actor.claims);
          const [read] = await tx.unsafe<{ count: number }[]>(
            // Table names come from pg_tables, never from input.
            `select count(*)::int as count from public."${table}"`,
          );
          expect(read?.count, `${actor.label} read ${table}`).toBe(0);
        });
        await inRolledBack(async (tx) => {
          await actAs(tx, actor.role, actor.claims);
          const deleted = await tx
            .unsafe(`delete from public."${table}"`)
            .catch(() => ({ count: 0 }));
          expect(deleted.count, `${actor.label} deleted from ${table}`).toBe(0);
        });
      }
    });
  }

  it("never reveals dietary notes to a browser, even through a join or a guessed id", async () => {
    const [target] = await client<
      { id: string }[]
    >`select id from guests where dietary_notes is not null limit 1`;
    for (const actor of browserRoles)
      await inRolledBack(async (tx) => {
        await actAs(tx, actor.role, actor.claims);
        expect(
          await tx`select g.dietary_notes from guests g join invitations i on i.id = g.invitation_id`,
          actor.label,
        ).toEqual([]);
        expect(await tx`select dietary_notes from guests where id = ${target?.id ?? ""}`).toEqual(
          [],
        );
      });
  });

  it("publishes no table to Realtime Postgres Changes", async () => {
    expect(
      await client`select tablename from pg_publication_tables where schemaname = 'public'`,
    ).toEqual([]);
  });

  it("lets a station receive only its own private broadcast channel", async () => {
    await inRolledBack(async (tx) => {
      for (const station of stations)
        await tx`insert into realtime.messages (topic, extension, event, payload, private)
          values (${"station:" + station}, 'broadcast', 'probe', ${tx.json({ station })}, true)`;
      await tx`insert into realtime.messages (topic, extension, event, payload, private)
        values ('station:kitchen', 'presence', 'probe', '{}'::jsonb, true)`;

      const visible = async (role: "anon" | "authenticated", claims: object, topic: string) => {
        await tx`savepoint probe`;
        await actAs(tx, role, claims);
        await tx`select set_config('realtime.topic', ${topic}, true)`;
        const rows = await tx<{ topic: string; extension: string }[]>`
          select topic, extension from realtime.messages where event = 'probe'`;
        await tx`rollback to savepoint probe`;
        return rows.map((row) => `${row.topic}/${row.extension}`);
      };

      for (const station of stations) {
        const mine = { sub: "probe-device", staff_station: station };
        expect(await visible("authenticated", mine, "station:" + station)).toEqual([
          `station:${station}/broadcast`,
        ]);
        for (const other of stations.filter((item) => item !== station))
          expect(await visible("authenticated", mine, "station:" + other)).toEqual([]);
      }
      expect(await visible("anon", {}, "station:kitchen")).toEqual([]);
      expect(await visible("authenticated", { sub: "probe" }, "station:kitchen")).toEqual([]);
      expect(
        await visible("authenticated", { sub: "probe", staff_station: "admin" }, "station:admin"),
      ).toEqual([]);
    });
  });

  it("gives browsers no way to send on a station channel", async () => {
    await inRolledBack(async (tx) => {
      await actAs(tx, "authenticated", { sub: "probe-device", staff_station: "kitchen" });
      await tx`select set_config('realtime.topic', 'station:kitchen', true)`;
      await expect(
        tx`insert into realtime.messages (topic, extension, event, payload, private)
          values ('station:kitchen', 'broadcast', 'forged', '{}'::jsonb, true)`,
      ).rejects.toThrow(/row-level security/);
    });
  });
});
