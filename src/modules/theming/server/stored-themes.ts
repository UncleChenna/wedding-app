import "server-only";
import { z } from "zod";
import { getActiveThemes, resolveActiveThemes } from "../lib/registry";
import type { ActiveThemes, ColorScheme } from "../lib/schema";

export type ThemeSelection = Readonly<Record<ColorScheme, string>>;
const selectionSchema = z
  .object({ light: z.string().min(1).max(100), dark: z.string().min(1).max(100) })
  .strict();

export async function readStoredThemes(
  load: () => Promise<unknown>,
  warn: (message: string) => void,
): Promise<{ themes: ActiveThemes; fallback: boolean }> {
  try {
    const selection = selectionSchema.parse(await load());
    return { themes: resolveActiveThemes(selection), fallback: false };
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
