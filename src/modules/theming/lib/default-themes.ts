import type { ActiveThemes, Theme } from "./schema";
import ivoryGold from "../themes/ivory-gold.json" with { type: "json" };
import midnightChampagne from "../themes/midnight-champagne.json" with { type: "json" };

/**
 * The default light/dark pair for the crash page, read straight from JSON so browser code doesn't ship Zod.
 * Both files are validated by `themes/index.ts`; a unit test keeps this equal to the validated pair.
 */
export const defaultActiveThemes: ActiveThemes = {
  light: ivoryGold as Theme,
  dark: midnightChampagne as Theme,
};
