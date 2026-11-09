import "server-only";
import { eq, inArray, sql } from "drizzle-orm";
import { db, schema, type Db } from "@/modules/shared/server/db/client";
import { getTheme } from "../lib/registry";
import type { ActiveThemes, Theme } from "../lib/schema";
import type { ThemeSelection } from "./stored-themes";
import { saveThemeSelection } from "./theme-repository";
import { assertThemeDraftsUnchanged, validateThemePublication } from "./theme-publication";

/** Internal only: caller must validate tokens and authorize an AAL2 administrator. */
export async function persistThemeDraft(theme: Theme, database: Pick<Db, "insert"> = db) {
  await database
    .insert(schema.themes)
    .values({
      id: theme.id,
      name: theme.name,
      tokens: theme,
    })
    .onConflictDoUpdate({
      target: schema.themes.id,
      set: { name: theme.name, tokens: theme, updatedAt: new Date() },
    });
}

/** No cache changes inside the transaction; callers invalidate only after commit. */
export async function publishThemeDrafts(
  selection: ThemeSelection,
  database: Pick<Db, "transaction"> = db,
  reviewed?: ActiveThemes,
) {
  return database.transaction(async (tx) => {
    // One transaction-scoped lock serializes all publications, including initial setup.
    await tx.execute(sql`select pg_advisory_xact_lock(181, 1)`);
    const rows = await tx
      .select()
      .from(schema.themes)
      .where(inArray(schema.themes.id, [selection.light, selection.dark]))
      .for("update");
    const draft = (id: string): unknown =>
      rows.find((row) => row.id === id)?.tokens ?? getTheme(id);
    const pair = validateThemePublication({
      light: draft(selection.light),
      dark: draft(selection.dark),
    });
    if (pair.light.id !== selection.light || pair.dark.id !== selection.dark) {
      throw new Error("Stored theme identity does not match its selection");
    }
    if (reviewed) assertThemeDraftsUnchanged(pair, reviewed);
    await tx.update(schema.themes).set({ isActive: false }).where(eq(schema.themes.isActive, true));
    for (const theme of [pair.light, pair.dark]) {
      await tx
        .insert(schema.themes)
        .values({
          id: theme.id,
          name: theme.name,
          tokens: theme,
          publishedTokens: theme,
          isActive: true,
        })
        .onConflictDoUpdate({
          target: schema.themes.id,
          set: { publishedTokens: theme, isActive: true, updatedAt: new Date() },
        });
    }
    await saveThemeSelection(selection, tx);
    return pair;
  });
}
