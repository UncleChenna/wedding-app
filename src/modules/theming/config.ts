/**
 * Safe light/dark defaults for unavailable database settings and static previews.
 * Live pages read event_settings through server/active-themes.ts.
 */
export const ACTIVE_THEME_IDS = {
  light: "ivory-gold",
  dark: "midnight-champagne",
} as const;

/** Used where there is no viewer to ask: link previews, seed data, preview defaults. */
export const DEFAULT_COLOR_SCHEME = "light";
