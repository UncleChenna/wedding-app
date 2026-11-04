import { randomUUID } from "node:crypto";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres, { type Sql } from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { assertDatabaseTarget } from "../database-target";
import { runSafeMigrations } from "../safe-migrate";

describe.runIf(process.env.RUN_UPGRADE_DB_TESTS === "1")("populated bootstrap upgrade", () => {
  let admin: Sql;
  let baseUrl: URL;
  const created: string[] = [];
  beforeAll(() => {
    process.loadEnvFile(".env.local");
    assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
    baseUrl = new URL(process.env.DATABASE_URL ?? "");
    admin = postgres(baseUrl.toString(), { max: 1, onnotice: () => {} });
  });
  afterAll(async () => {
    for (const name of created) await admin.unsafe(`drop database "${name}"`);
    if (admin) await admin.end();
  });
  async function legacy() {
    const name = "wedding_t211_" + randomUUID().replaceAll("-", "");
    await admin.unsafe(`create database "${name}"`);
    created.push(name);
    const target = new URL(baseUrl);
    target.pathname = "/" + name;
    const client = postgres(target.toString(), { max: 1, onnotice: () => {} });
    const folder = mkdtempSync(join(tmpdir(), "wedding-t211-migrations-"));
    mkdirSync(join(folder, "meta"));
    const journal = JSON.parse(readFileSync("drizzle/meta/_journal.json", "utf8"));
    writeFileSync(
      join(folder, "meta/_journal.json"),
      JSON.stringify({ ...journal, entries: journal.entries.slice(0, 1) }),
    );
    copyFileSync("drizzle/0000_init.sql", join(folder, "0000_init.sql"));
    try {
      await migrate(drizzle(client), { migrationsFolder: folder });
    } finally {
      rmSync(folder, { recursive: true });
    }
    for (let household = 0; household < 3; household++) {
      const id = randomUUID();
      await client`insert into invitations(id,code,household_name,max_guests,sent_at) values(${id},${"legacycode" + household},${"Synthetic household " + household},${household + 1},now())`;
      for (let person = 0; person <= household; person++)
        await client`insert into guests(id,invitation_id,first_name,last_name,email,phone,is_primary,qr_token) values(${randomUUID()},${id},${"Member" + person},'Synthetic','shared@example.test','+12025550123',${person === 0},${randomUUID()})`;
      await client`insert into rsvps(invitation_id,status,responded_at) values(${id},${household === 0 ? "pending" : household === 1 ? "declined" : "attending"},${household === 0 ? null : "2026-10-01T10:00:00Z"})`;
    }
    await client`insert into check_ins(guest_id,checked_in_at,client_event_id) select id,now(),${randomUUID()} from guests limit 1`;
    return client;
  }
  it("refuses implicit legacy conversion and leaves all original records intact", async () => {
    const client = await legacy();
    try {
      await expect(
        runSafeMigrations(client, { migrationsFolder: resolve("drizzle") }),
      ).rejects.toThrow("Legacy upgrade requires");
      expect(await client`select first_name,qr_token from guests`).toHaveLength(6);
      expect(await client`select code from invitations`).toHaveLength(3);
      expect(await client`select * from drizzle.__drizzle_migrations`).toHaveLength(1);
    } finally {
      await client.end();
    }
  });
  it("preserves identities, shared contacts, pending/declined/attending meaning and original data", async () => {
    const client = await legacy();
    try {
      const ids = (await client`select id from guests order by id`).map((row) => row.id);
      await client`update guests set created_at='2026-10-01T10:00:00.123456Z'`;
      const originals =
        await client`select id as source_id,to_jsonb(g) as record from guests g order by id`;
      const options = {
        migrationsFolder: resolve("drizzle"),
        upgradeLegacy: true,
        allowLegacyTokenReissue: true,
      };
      const result = await runSafeMigrations(client, options);
      expect(result).toMatchObject({ legacyUpgraded: true, reissuedTokens: 3 });
      expect((await client`select id from guests order by id`).map((row) => row.id)).toEqual(ids);
      expect(
        (await client`select to_char(created_at,'US') as precision from guests`).every(
          (row) => row.precision === "123456",
        ),
      ).toBe(true);
      expect(
        await client`select id from guests where email='shared@example.test' and phone='+12025550123'`,
      ).toHaveLength(6);
      expect(await client`select id from check_ins`).toHaveLength(1);
      const members =
        await client`select attendance,count(*)::int as count from member_rsvps group by attendance order by attendance`;
      expect(members).toEqual([
        { attendance: "no", count: 2 },
        { attendance: "pending", count: 1 },
        { attendance: "yes", count: 3 },
      ]);
      const archive =
        await client`select source_table,count(*)::int as count from legacy_migration_records group by source_table order by source_table`;
      expect(archive).toEqual([
        { source_table: "check_ins", count: 1 },
        { source_table: "guests", count: 6 },
        { source_table: "invitations", count: 3 },
        { source_table: "rsvps", count: 3 },
      ]);
      expect(
        (
          await client`select record from legacy_migration_records where source_table='invitations'`
        )[0]?.record,
      ).toHaveProperty("code");
      expect(await runSafeMigrations(client, options)).toMatchObject({ legacyUpgraded: false });
      expect(await client`select id from guests`).toHaveLength(6);
      expect(await client`select id from legacy_migration_records`).toHaveLength(13);
      expect(
        await client`select source_id,record from legacy_migration_records where source_table='guests' order by source_id`,
      ).toEqual(originals);
      expect(
        await client`select relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and not c.relrowsecurity`,
      ).toHaveLength(0);
    } finally {
      await client.end();
    }
  });
  it("retains valid private link tokens without authorizing reissue", async () => {
    const client = await legacy();
    try {
      const ids = await client<{ id: string }[]>`select id from invitations order by id`;
      for (const [index, row] of ids.entries())
        await client`update invitations set code=${String(index).repeat(43)} where id=${row.id}`;
      const before = (await client`select code from invitations order by id`).map(
        (row) => row.code,
      );
      expect(
        await runSafeMigrations(client, {
          migrationsFolder: resolve("drizzle"),
          upgradeLegacy: true,
        }),
      ).toMatchObject({ legacyUpgraded: true, reissuedTokens: 0 });
      expect(
        (await client`select token from invitations order by id`).map((row) => row.token),
      ).toEqual(before);
    } finally {
      await client.end();
    }
  });
  it("preserves a large legacy group's allowance without inventing people or splitting it", async () => {
    const client = await legacy();
    try {
      const [group] = await client<
        { id: string }[]
      >`select invitation_id as id from rsvps where status='attending'`;
      if (!group) throw new Error("Missing group fixture");
      await client`update invitations set max_guests=25 where id=${group.id}`;
      for (let index = 0; index < 17; index++)
        await client`insert into guests(invitation_id,first_name,last_name,is_primary,qr_token) values(${group.id},${"Added" + index},'Synthetic',false,${randomUUID()})`;
      await runSafeMigrations(client, {
        migrationsFolder: resolve("drizzle"),
        upgradeLegacy: true,
        allowLegacyTokenReissue: true,
      });
      expect(
        (await client`select max_tag_alongs from invitations where id=${group.id}`)[0]
          ?.max_tag_alongs,
      ).toBe(24);
      expect(
        await client`select guest_id from member_rsvps where invitation_id=${group.id}`,
      ).toHaveLength(20);
      expect(
        (await client`select count_attending from rsvps where invitation_id=${group.id}`)[0]
          ?.count_attending,
      ).toBe(20);
    } finally {
      await client.end();
    }
  });
  it("requires separate acknowledgement for weak codes even when upgrade is enabled", async () => {
    const client = await legacy();
    try {
      await expect(
        runSafeMigrations(client, { migrationsFolder: resolve("drizzle"), upgradeLegacy: true }),
      ).rejects.toThrow("--allow-legacy-token-reissue");
      expect(await client`select first_name from guests`).toHaveLength(6);
      expect(await client`select id from drizzle.__drizzle_migrations`).toHaveLength(1);
    } finally {
      await client.end();
    }
  });
  it("rolls back schema, data and journal together if a pending migration fails", async () => {
    const client = await legacy();
    const folder = mkdtempSync(join(tmpdir(), "wedding-t211-failure-"));
    mkdirSync(join(folder, "meta"));
    try {
      for (const name of readdirSync("drizzle").filter((name) => name.endsWith(".sql")))
        copyFileSync(join("drizzle", name), join(folder, name));
      const journal = JSON.parse(readFileSync("drizzle/meta/_journal.json", "utf8"));
      const last = journal.entries.at(-1);
      journal.entries.push({
        idx: last.idx + 1,
        version: "7",
        when: last.when + 1,
        tag: "9999_failure_rehearsal",
        breakpoints: true,
      });
      writeFileSync(join(folder, "meta/_journal.json"), JSON.stringify(journal));
      writeFileSync(join(folder, "9999_failure_rehearsal.sql"), "select 1/0;");
      await expect(
        runSafeMigrations(client, {
          migrationsFolder: folder,
          upgradeLegacy: true,
          allowLegacyTokenReissue: true,
        }),
      ).rejects.toThrow();
      expect(await client`select first_name,qr_token from guests`).toHaveLength(6);
      expect(await client`select code from invitations`).toHaveLength(3);
      expect(await client`select id from check_ins`).toHaveLength(1);
      expect(await client`select id from drizzle.__drizzle_migrations`).toHaveLength(1);
      expect(
        (await client`select to_regclass('public.member_rsvps') as relation`)[0]?.relation,
      ).toBeNull();
    } finally {
      await client.end();
      rmSync(folder, { recursive: true });
    }
  });
});
