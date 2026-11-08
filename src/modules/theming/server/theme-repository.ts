import "server-only";
import { eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db, schema, type Db } from "@/modules/shared/server/db/client";
import type { ThemeSelection } from "./stored-themes";

/** One statement observes selection and both published snapshots consistently. */
export async function loadPublishedThemeSelection(database: Pick<Db, "select"> = db) {
  const lightTheme = alias(schema.themes, "light_theme");
  const darkTheme = alias(schema.themes, "dark_theme");
  const [row] = await database
    .select({
      light: schema.eventSettings.activeThemeId,
      dark: schema.eventSettings.activeDarkThemeId,
      publishedLight: lightTheme.publishedTokens,
      publishedDark: darkTheme.publishedTokens,
    })
    .from(schema.eventSettings)
    .leftJoin(lightTheme, eq(lightTheme.id, schema.eventSettings.activeThemeId))
    .leftJoin(darkTheme, eq(darkTheme.id, schema.eventSettings.activeDarkThemeId))
    .where(eq(schema.eventSettings.id, 1))
    .limit(1);
  return row
    ? {
        light: row.light,
        dark: row.dark,
        published: { light: row.publishedLight, dark: row.publishedDark },
      }
    : null;
}

export async function loadThemeSelection(database: Pick<Db, "select"> = db) {
  const [row] = await database
    .select({
      light: schema.eventSettings.activeThemeId,
      dark: schema.eventSettings.activeDarkThemeId,
    })
    .from(schema.eventSettings)
    .where(eq(schema.eventSettings.id, 1))
    .limit(1);
  return row ?? null;
}

export async function saveThemeSelection(
  selection: ThemeSelection,
  database: Pick<Db, "insert"> = db,
): Promise<void> {
  const values = { activeThemeId: selection.light, activeDarkThemeId: selection.dark };
  await database
    .insert(schema.eventSettings)
    .values({ id: 1, ...values })
    .onConflictDoUpdate({
      target: schema.eventSettings.id,
      set: { ...values, updatedAt: new Date() },
    });
}
