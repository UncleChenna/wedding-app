import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import { eq } from "drizzle-orm";
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
      client = postgres(url, { max: 1, prepare: false });
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
  },
);
