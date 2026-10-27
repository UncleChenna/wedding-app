import { ACTIVE_THEME_IDS, DEFAULT_COLOR_SCHEME } from "../config";
import { themes } from "../themes";
import type { ActiveThemes, ColorScheme, Theme } from "./schema";

export function getTheme(id: string): Theme {
  const theme = themes.find((t) => t.id === id);
  if (!theme) {
    throw new Error(`Unknown theme "${id}". Available: ${themes.map((t) => t.id).join(", ")}`);
  }
  return theme;
}

/** Resolve a light/dark pair of ids, rejecting a theme placed in the wrong scheme's slot. */
export function resolveActiveThemes(ids: Readonly<Record<ColorScheme, string>>): ActiveThemes {
  const pick = (scheme: ColorScheme): Theme => {
    const theme = getTheme(ids[scheme]);
    if (theme.colorScheme !== scheme) {
      throw new Error(
        `Theme "${theme.id}" is a ${theme.colorScheme} theme and cannot be the ${scheme}-mode theme.`,
      );
    }
    return theme;
  };
  return { light: pick("light"), dark: pick("dark") };
}

/** The themes for light and dark devices, from src/modules/theming/config.ts. */
export function getActiveThemes(): ActiveThemes {
  return resolveActiveThemes(ACTIVE_THEME_IDS);
}

/** The active theme for one scheme; the default scheme where no viewer is known. */
export function getActiveTheme(scheme: ColorScheme = DEFAULT_COLOR_SCHEME): Theme {
  return getActiveThemes()[scheme];
}

export function listThemes(): readonly Theme[] {
  return themes;
}
