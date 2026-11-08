import "server-only";
import { z } from "zod";
import { loadTheme, ThemeValidationError } from "../lib/load-theme";
import type { ActiveThemes } from "../lib/schema";

const pairSchema = z.object({ light: z.unknown(), dark: z.unknown() }).strict();

/** Revalidate stored drafts at the publication boundary, not just on initial save. */
export function validateThemePublication(input: unknown): ActiveThemes {
  const pair = pairSchema.parse(input);
  const light = loadTheme(pair.light);
  const dark = loadTheme(pair.dark);
  if (light.colorScheme !== "light" || dark.colorScheme !== "dark") {
    throw new ThemeValidationError(
      "Choose a light theme for light mode and a dark theme for dark mode.",
    );
  }
  return { light, dark };
}
