import { ACTIVE_THEME_ID } from "../config";
import { themes } from "../themes";
import type { Theme } from "./schema";

export function getTheme(id: string): Theme {
  const theme = themes.find((t) => t.id === id);
  if (!theme) {
    throw new Error(`Unknown theme "${id}". Available: ${themes.map((t) => t.id).join(", ")}`);
  }
  return theme;
}

export function getActiveTheme(): Theme {
  return getTheme(ACTIVE_THEME_ID);
}

export function listThemes(): readonly Theme[] {
  return themes;
}
