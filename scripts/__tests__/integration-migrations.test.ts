import { randomBytes, randomUUID } from "node:crypto";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { readMigrationFiles } from "drizzle-orm/migrator";
import postgres, { type Sql } from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { assertDatabaseTarget } from "../database-target";
import baseline from "../fixtures/t216-develop-history.json";

const enabled = process.env.RUN_INTEGRATION_MIGRATION_TESTS === "1";

describe.runIf(enabled)("TICKET-216 append-only integration migrations", () => {
  let admin: Sql;
  let baseUrl: URL;
  let folder: string;
  let prefix: string;
  const created: string[] = [];

  beforeAll(() => {
    process.loadEnvFile(".env.local");
    assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
    baseUrl = new URL(process.env.DATABASE_URL ?? "");
    folder = resolve(process.env.T216_MIGRATIONS_FOLDER ?? "drizzle");
    if (![resolve("drizzle"), resolve(".harness/migration-preview/out")].includes(folder))
      throw new Error("Migration fixture folder refused");
    const entries = readMigrationFiles({ migrationsFolder: folder });
    expect(entries.slice(0, baseline.entries.length).map((entry) => entry.hash)).toEqual(
      baseline.entries.map((entry) => entry.sha256),
    );
    expect(entries.slice(0, baseline.entries.length).map((entry) => entry.folderMillis)).toEqual(
      baseline.entries.map((entry) => entry.when),
    );
    admin = postgres(baseUrl.toString(), { max: 1, onnotice: () => {} });
    prefix = mkdtempSync(join(tmpdir(), "wedding-t216-develop-prefix-"));
    mkdirSync(join(prefix, "meta"));
    const journal = JSON.parse(readFileSync(join(folder, "meta/_journal.json"), "utf8"));
    writeFileSync(
      join(prefix, "meta/_journal.json"),
      JSON.stringify({ ...journal, entries: journal.entries.slice(0, baseline.entries.length) }),
    );
    for (const entry of baseline.entries)
      copyFileSync(join(folder, entry.tag + ".sql"), join(prefix, entry.tag + ".sql"));
  });

  afterAll(async () => {
    if (admin) {
      for (const name of created) await admin.unsafe(`drop database "${name}"`);
      await admin.end();
    }
    if (prefix) rmSync(prefix, { recursive: true });
  });

  async function database() {
    const name = "wedding_t216_" + randomUUID().replaceAll("-", "");
    await admin.unsafe(`create database "${name}"`);
    created.push(name);
    const url = new URL(baseUrl);
    url.pathname = "/" + name;
    return postgres(url.toString(), { max: 1, onnotice: () => {} });
  }

  async function populate(client: Sql) {
    const invitations: string[] = [];
    const guests: string[] = [];
    for (let party = 0; party < 3; party++) {
      const id = randomUUID();
      invitations.push(id);
      await client`insert into invitations(id,token,household_name,status) values(${id},${randomBytes(32).toString("base64url")},${"Synthetic T216 party " + party},${party === 0 ? "sent" : party === 1 ? "rsvp_yes" : "rsvp_no"})`;
      for (let member = 0; member <= party; member++) {
        const guestId = randomUUID();
        guests.push(guestId);
        await client`insert into guests(id,invitation_id,name,email,phone,is_primary,dietary_notes,created_at) values(${guestId},${id},${"Synthetic member " + member},'shared@example.test','+12025550123',${member === 0},${member === 0 ? "Vegetarian" : "Guest dietary note"},'2026-10-01T10:00:00.123456Z')`;
      }
      if (party > 0)
        await client`insert into rsvps(invitation_id,attending,count_attending,responded_at) values(${id},${party === 1},${party === 1 ? 2 : 0},'2026-10-01T10:00:00.123456Z')`;
    }
    const arrived = guests[1];
    if (!arrived) throw new Error("Missing synthetic arrival");
    await client`insert into check_ins(guest_id,checked_in_at,client_event_id) values(${arrived},'2026-10-01T11:00:00.123456Z',${randomUUID()})`;
    await client`insert into event_settings(id,time_zone,retention_days) values(1,'Etc/UTC',90)`;
    const [individualId, familyId, groupId] = invitations;
    if (!individualId || !familyId || !groupId) throw new Error("Missing synthetic invitation");
    return { individualId, familyId, groupId, guests };
  }

  async function snapshot(client: Sql) {
    return {
      invitations:
        await client`select to_jsonb(i)-array['rsvp_revision','rsvp_reopen_until','kind'] as record from invitations i order by id`,
      guests: await client`select to_jsonb(g)-'age_band' as record from guests g order by id`,
      rsvps: await client`select to_jsonb(r) as record from rsvps r order by id`,
      checkIns: await client`select to_jsonb(c) as record from check_ins c order by id`,
    };
  }

  it("applies a clean chain twice without drift and keeps every public table protected", async () => {
    const client = await database();
    try {
      await migrate(drizzle(client), { migrationsFolder: folder });
      const first =
        await client`select hash,created_at from drizzle.__drizzle_migrations order by id`;
      expect(first).toHaveLength(baseline.entries.length + 3);
      await migrate(drizzle(client), { migrationsFolder: folder });
      expect(
        await client`select hash,created_at from drizzle.__drizzle_migrations order by id`,
      ).toEqual(first);
      expect(
        await client`select relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and not c.relrowsecurity`,
      ).toEqual([]);
      expect(await client`select * from pg_policies where schemaname='public'`).toEqual([]);
    } finally {
      await client.end();
    }
  });

  it("preserves individual/family/group records, shared contacts, diet, precision and arrivals", async () => {
    const client = await database();
    try {
      await migrate(drizzle(client), { migrationsFolder: prefix });
      const ids = await populate(client);
      const before = await snapshot(client);
      await migrate(drizzle(client), { migrationsFolder: folder });
      expect(await snapshot(client)).toEqual(before);
      expect(
        await client`select attendance,count(*)::int as count from member_rsvps group by attendance order by attendance`,
      ).toEqual([
        { attendance: "no", count: 3 },
        { attendance: "pending", count: 1 },
        { attendance: "yes", count: 2 },
      ]);
      expect(
        await client`select id from guests where email='shared@example.test' and phone='+12025550123'`,
      ).toHaveLength(6);
      expect(await client`select to_char(created_at,'US') as precision from guests`).toEqual(
        Array.from({ length: 6 }, () => ({ precision: "123456" })),
      );
      expect(await client`select retention_days from event_settings where id=1`).toEqual([
        { retention_days: 365 },
      ]);
      expect(await client`select kind from invitations where id=${ids.individualId}`).toEqual([
        { kind: "individual" },
      ]);
      expect(await client`select kind from invitations where id=${ids.familyId}`).toEqual([
        { kind: "group" },
      ]);
      const first =
        await client`select hash,created_at from drizzle.__drizzle_migrations order by id`;
      await migrate(drizzle(client), { migrationsFolder: folder });
      expect(await snapshot(client)).toEqual(before);
      expect(
        await client`select hash,created_at from drizzle.__drizzle_migrations order by id`,
      ).toEqual(first);
    } finally {
      await client.end();
    }
  });

  it("refuses ambiguous aggregate attendance and rolls back the entire integration", async () => {
    const client = await database();
    try {
      await migrate(drizzle(client), { migrationsFolder: prefix });
      const ids = await populate(client);
      await client`update rsvps set count_attending=1 where invitation_id=${ids.familyId}`;
      const before = await snapshot(client);
      await expect(migrate(drizzle(client), { migrationsFolder: folder })).rejects.toThrow(
        "requires reviewed member reconciliation",
      );
      expect(await snapshot(client)).toEqual(before);
      expect(await client`select hash from drizzle.__drizzle_migrations`).toHaveLength(
        baseline.entries.length,
      );
      expect(await client`select to_regclass('public.member_rsvps') as relation`).toEqual([
        { relation: null },
      ]);
    } finally {
      await client.end();
    }
  });
});
