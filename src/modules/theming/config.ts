/**
 * THE ONE PLACE to choose the site's themes. Each guest sees the theme that matches their
 * device's light or dark setting. Change an id to any theme in src/modules/theming/themes/
 * with that colour scheme and every page restyles on the next render.
 */
export const ACTIVE_THEME_IDS = {
  light: "ivory-gold",
  dark: "midnight-champagne",
} as const;

/** Used where there is no viewer to ask: link previews, seed data, preview defaults. */
export const DEFAULT_COLOR_SCHEME = "light";
