// Plain token lists, free of Zod, so browser code (e.g. the crash page) can use them without the validator.

/** Every colour a theme must define. Each becomes `--t-color-<token>` and a Tailwind colour. */
export const COLOR_TOKENS = [
  "background",
  "foreground",
  "surface",
  "surface-muted",
  "muted-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "accent",
  "accent-foreground",
  "border",
  "input",
  "ring",
  // Semantic statuses, fixed in meaning across every theme (THM-4; see lib/status.ts):
  // success = valid/done (green), warning = already used/waiting (amber), danger = invalid/problem (red).
  // Each has a solid fill, text on that fill, a tinted panel and text on the panel.
  "danger",
  "danger-foreground",
  "danger-subtle",
  "danger-subtle-foreground",
  "success",
  "success-foreground",
  "success-subtle",
  "success-subtle-foreground",
  "warning",
  "warning-foreground",
  "warning-subtle",
  "warning-subtle-foreground",
  // Decorative fill (e.g. champagne) for ornaments and panels; never body text. Text placed
  // on it uses `decorative-foreground`.
  "decorative",
  "decorative-foreground",
  // QR codes are always dark ink on light paper, even in dark themes, so every phone can scan
  // them (design principles §5; validated in lib/contrast.ts).
  "qr-ink",
  "qr-paper",
] as const;

/**
 * Fonts a theme may reference. Each key must be loaded in
 * `src/modules/theming/components/fonts.ts`, which exposes `--font-<key>`.
 */
export const FONT_KEYS = ["cormorant", "playfair", "inter", "jost"] as const;

export const RADIUS_TOKENS = ["sm", "md", "lg"] as const;
export const SHADOW_TOKENS = ["sm", "md", "lg"] as const;

export type ColorToken = (typeof COLOR_TOKENS)[number];
export type FontKey = (typeof FONT_KEYS)[number];
