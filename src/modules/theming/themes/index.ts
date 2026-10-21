import { loadTheme } from "../lib/load-theme";
import type { Theme } from "../lib/schema";
import ivoryGold from "./ivory-gold.json" with { type: "json" };
import midnightChampagne from "./midnight-champagne.json" with { type: "json" };

/**
 * Every available theme. Add new theme JSON files here (see docs/theming.md).
 * Each theme is validated (schema + WCAG AA) when this module loads, so an
 * inaccessible theme fails tests and the build.
 */
export const themes: readonly Theme[] = [ivoryGold, midnightChampagne].map(loadTheme);
