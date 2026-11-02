import "server-only";
import { eq } from "drizzle-orm";
import { db, schema, type Db } from "@/modules/shared/server/db/client";
import type { ThemeSelection } from "./stored-themes";

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
