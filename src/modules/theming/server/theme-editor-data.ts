import "server-only";
import { db, schema } from "@/modules/shared/server/db/client";
import { inArray } from "drizzle-orm";
import { loadTheme } from "../lib/load-theme";
import { getStoredActiveThemes } from "./active-themes";

/** Internal read; the admin page must authorize before invoking it. */
export async function loadThemeEditorData() {
  const active = await getStoredActiveThemes();
  const rows = await db
    .select({ id: schema.themes.id, tokens: schema.themes.tokens })
    .from(schema.themes)
    .where(inArray(schema.themes.id, ["wedding-light", "wedding-dark"]));
  const drafts = rows.flatMap((row) => {
    try {
      const theme = loadTheme(row.tokens);
      return theme.id === row.id ? [theme] : [];
    } catch {
      return [];
    }
  });
  return { active, drafts };
}
