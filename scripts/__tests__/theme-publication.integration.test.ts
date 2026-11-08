import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import { eq, sql } from "drizzle-orm";
import type { Db } from "../../src/modules/shared/server/db/client";
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { assertDatabaseTarget } from "../database-target";
import * as schema from "../../src/modules/shared/server/db/schema";
import { getTheme } from "../../src/modules/theming/lib/registry";

let client: Sql;
const rollback = new Error("rollback theme publication fixtures");
type Transaction = Parameters<Parameters<Db["transaction"]>[0]>[0];
async function isolated(run: (database: Transaction) => Promise<void>) {
  try {
    await drizzle(client, { schema }).transaction(async (database) => {
      await run(database);
      throw rollback;
    });
  } catch (error) {
    if (error !== rollback) throw error;
  }
}
const fixture = () => {
  const suffix = randomUUID();
  return {
    light: { ...getTheme("ivory-gold"), id: `test-light-${suffix}`, pattern: undefined },
    dark: { ...getTheme("emerald-night"), id: `test-dark-${suffix}`, pattern: undefined },
  };
};

describe.runIf(process.env.RUN_THEME_PUBLICATION_DB_TESTS === "1")(
  "theme publication storage",
  () => {
    beforeAll(() => {
      process.loadEnvFile(".env.local");
      const url = process.env.DATABASE_URL ?? "";
      assertDatabaseTarget(url, { localOnly: true });
      client = postgres(url, { max: 3, prepare: false });
    });
    afterAll(async () => {
      if (client) await client.end();
    });

    it("keeps further edits in the draft until explicitly published", () =>
      isolated(async (database) => {
        const { persistThemeDraft, publishThemeDrafts } =
          await import("../../src/modules/theming/server/theme-draft-repository");
        const { loadPublishedThemeSelection } =
          await import("../../src/modules/theming/server/theme-repository");
        const { readStoredThemes } = await import("../../src/modules/theming/server/stored-themes");
        const pair = fixture();
        await persistThemeDraft(pair.light, database);
        await persistThemeDraft(pair.dark, database);
        await publishThemeDrafts({ light: pair.light.id, dark: pair.dark.id }, database);
        const edited = { ...pair.light, name: "Unpublished name" };
        await persistThemeDraft(edited, database);
        const read = () =>
          readStoredThemes(
            () => loadPublishedThemeSelection(database),
            () => {
              throw new Error("Unexpected fallback");
            },
          );
        expect((await read()).themes.light.name).toBe(pair.light.name);
        await publishThemeDrafts({ light: pair.light.id, dark: pair.dark.id }, database);
        expect((await read()).themes.light.name).toBe("Unpublished name");
        const active = await database
          .select({ id: schema.themes.id })
          .from(schema.themes)
          .where(eq(schema.themes.isActive, true))
          .orderBy(schema.themes.id);
        expect(active.map((row) => row.id).sort()).toEqual([pair.light.id, pair.dark.id].sort());
      }));

    it("preserves the selected pair when stored draft validation fails", () =>
      isolated(async (database) => {
        const { persistThemeDraft, publishThemeDrafts } =
          await import("../../src/modules/theming/server/theme-draft-repository");
        const { loadPublishedThemeSelection } =
          await import("../../src/modules/theming/server/theme-repository");
        const pair = fixture();
        await persistThemeDraft(pair.light, database);
        await persistThemeDraft(pair.dark, database);
        await publishThemeDrafts({ light: pair.light.id, dark: pair.dark.id }, database);
        const before = await loadPublishedThemeSelection(database);
        await database
          .update(schema.themes)
          .set({ tokens: { ...pair.light, fonts: { display: "unknown", body: "inter" } } })
          .where(eq(schema.themes.id, pair.light.id));
        await expect(
          publishThemeDrafts({ light: pair.light.id, dark: pair.dark.id }, database),
        ).rejects.toThrow(/fonts.display/);
        expect(await loadPublishedThemeSelection(database)).toEqual(before);
      }));

    it("rejects inconsistent stored identities without altering published rows", () =>
      isolated(async (database) => {
        const { persistThemeDraft, publishThemeDrafts } =
          await import("../../src/modules/theming/server/theme-draft-repository");
        const pair = fixture();
        await persistThemeDraft(pair.light, database);
        await persistThemeDraft(pair.dark, database);
        await publishThemeDrafts({ light: pair.light.id, dark: pair.dark.id }, database);
        const read = () =>
          database
            .select({
              id: schema.themes.id,
              isActive: schema.themes.isActive,
              publishedTokens: schema.themes.publishedTokens,
            })
            .from(schema.themes)
            .orderBy(schema.themes.id);
        const before = await read();
        await database
          .update(schema.themes)
          .set({ tokens: { ...pair.dark, id: "mismatched-dark" } })
          .where(eq(schema.themes.id, pair.dark.id));
        await expect(
          publishThemeDrafts({ light: pair.light.id, dark: pair.dark.id }, database),
        ).rejects.toThrow(/identity/);
        expect(await read()).toEqual(before);
      }));
    it("rolls back published rows and flags if the final selection write fails", () =>
      isolated(async (database) => {
        const { persistThemeDraft, publishThemeDrafts } =
          await import("../../src/modules/theming/server/theme-draft-repository");
        const { loadPublishedThemeSelection } =
          await import("../../src/modules/theming/server/theme-repository");
        const initial = fixture();
        await persistThemeDraft(initial.light, database);
        await persistThemeDraft(initial.dark, database);
        await publishThemeDrafts({ light: initial.light.id, dark: initial.dark.id }, database);
        const proposed = fixture();
        proposed.light.id = `test-fail-${randomUUID()}`;
        await persistThemeDraft(proposed.light, database);
        await persistThemeDraft(proposed.dark, database);
        const readRows = () => database.select().from(schema.themes).orderBy(schema.themes.id);
        const beforeRows = await readRows();
        const beforeSelection = await loadPublishedThemeSelection(database);
        // Synthetic failure only; this DDL and all fixture writes roll back together.
        await database.execute(sql`alter table event_settings add constraint test_181_selection_failure
          check (active_theme_id not like 'test-fail-%') not valid`);
        await expect(
          publishThemeDrafts({ light: proposed.light.id, dark: proposed.dark.id }, database),
        ).rejects.toMatchObject({ cause: { code: "23514" } });
        expect(await readRows()).toEqual(beforeRows);
        expect(await loadPublishedThemeSelection(database)).toEqual(beforeSelection);
      }));
    it("serializes competing publications across separate database connections", async () => {
      const { persistThemeDraft, publishThemeDrafts } =
        await import("../../src/modules/theming/server/theme-draft-repository");
      const { loadPublishedThemeSelection } =
        await import("../../src/modules/theming/server/theme-repository");
      const ready = Promise.withResolvers<void>();
      const release = Promise.withResolvers<void>();
      const secondPid = Promise.withResolvers<number>();
      const first = isolated(async (database) => {
        try {
          const pair = fixture();
          await persistThemeDraft(pair.light, database);
          await persistThemeDraft(pair.dark, database);
          await publishThemeDrafts({ light: pair.light.id, dark: pair.dark.id }, database);
          ready.resolve();
          await release.promise;
        } catch (error) {
          ready.reject(error);
          throw error;
        }
      });
      // Attach rejection observers immediately; failures are asserted again below.
      void first.catch(() => {});
      let second: Promise<void> | undefined;
      try {
        await ready.promise;
        second = isolated(async (database) => {
          try {
            const rows = await database.execute<{ pid: number }>(
              sql`select pg_backend_pid() as pid`,
            );
            const pid = rows[0]?.pid;
            if (!pid) throw new Error("Missing second backend PID");
            secondPid.resolve(pid);
            const pair = fixture();
            await persistThemeDraft(pair.light, database);
            await persistThemeDraft(pair.dark, database);
            await publishThemeDrafts({ light: pair.light.id, dark: pair.dark.id }, database);
            const selected = await loadPublishedThemeSelection(database);
            expect(selected).toMatchObject({ light: pair.light.id, dark: pair.dark.id });
            const active = await database
              .select({ id: schema.themes.id })
              .from(schema.themes)
              .where(eq(schema.themes.isActive, true));
            expect(active.map((row) => row.id).sort()).toEqual(
              [pair.light.id, pair.dark.id].sort(),
            );
          } catch (error) {
            secondPid.reject(error);
            throw error;
          }
        });
        void second.catch(() => {});
        const pid = await secondPid.promise;
        await expect
          .poll(async () => {
            const locks = await client`select granted from pg_locks where pid = ${pid}
            and locktype = 'advisory' and classid = 181 and objid = 1`;
            return locks.some((lock) => lock.granted === false);
          })
          .toBe(true);
      } finally {
        release.resolve();
        const results = await Promise.allSettled([first, ...(second ? [second] : [])]);
        for (const result of results) if (result.status === "rejected") throw result.reason;
      }
    });
  },
);
