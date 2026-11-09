import "server-only";
import { z } from "zod";
import { getActiveThemes, getTheme, resolveActiveThemes } from "../lib/registry";
import { validateThemePublication } from "./theme-publication";
import type { ActiveThemes, ColorScheme } from "../lib/schema";

export type ThemeSelection = Readonly<Record<ColorScheme, string>>;
export const selectionSchema = z
  .object({ light: z.string().min(1).max(100), dark: z.string().min(1).max(100) })
  .strict();
const storedSelectionSchema = selectionSchema.extend({
  published: z.object({ light: z.unknown(), dark: z.unknown() }).optional(),
});

export async function readStoredThemes(
  load: () => Promise<unknown>,
  warn: (message: string) => void,
): Promise<{ themes: ActiveThemes; fallback: boolean }> {
  try {
    const selection = storedSelectionSchema.parse(await load());
    const themes = validateThemePublication({
      light: selection.published?.light ?? getTheme(selection.light),
      dark: selection.published?.dark ?? getTheme(selection.dark),
    });
    if (themes.light.id !== selection.light || themes.dark.id !== selection.dark) {
      throw new Error("Published theme identity mismatch");
    }
    return { themes, fallback: false };
  } catch {
    // Never serialize database errors, connection URLs or untrusted stored input.
    warn("Theme selection unavailable; using default light and dark themes");
    return { themes: getActiveThemes(), fallback: true };
  }
}

/** Internal service, not a Server Action. Call only after authorizing the administrator. */
export async function activateStoredThemes(
  input: unknown,
  save: (selection: ThemeSelection) => Promise<void>,
  invalidate: () => void,
): Promise<void> {
  const selection = selectionSchema.parse(input);
  resolveActiveThemes(selection);
  await save(selection);
  invalidate();
}
