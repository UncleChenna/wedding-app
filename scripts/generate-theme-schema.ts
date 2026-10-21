/**
 * Write src/modules/theming/themes/theme.schema.json from the Zod schema, so
 * editors autocomplete and validate theme files. Run: pnpm themes:schema
 */
import { writeFileSync } from "node:fs";

import { z } from "zod";

import { themeSchema } from "../src/modules/theming/lib/schema";

export const THEME_SCHEMA_PATH = "src/modules/theming/themes/theme.schema.json";

export function renderThemeJsonSchema(): string {
  const jsonSchema = z.toJSONSchema(themeSchema, { io: "input" });
  return `${JSON.stringify({ title: "Wedding site theme", ...jsonSchema }, null, 2)}\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  writeFileSync(THEME_SCHEMA_PATH, renderThemeJsonSchema());
  console.log(`Wrote ${THEME_SCHEMA_PATH}`);
}
