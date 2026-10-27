import { z } from "zod";

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

const hexColor = z
  .string()
  // eslint-disable-next-line no-restricted-syntax -- example value in a validation message, not a style
  .regex(/^#[0-9a-fA-F]{6}$/, "Colours must be 6-digit hex, e.g. #1A2B3C");

const cssLength = z.string().regex(/^\d*\.?\d+(rem|px)$/, "Radii must be rem or px, e.g. 0.75rem");

function record<const K extends readonly string[], V extends z.ZodType>(keys: K, value: V) {
  return z.object(Object.fromEntries(keys.map((key) => [key, value])) as Record<K[number], V>);
}

/**
 * Optional paper texture (PRD THM-1 `pattern`). The SVG is used as a CSS mask painted in the
 * theme's foreground colour, so it never introduces its own colours. Strength is capped so
 * the texture cannot erode text contrast; see docs/theming.md.
 */
export const patternSchema = z
  .object({
    src: z
      .string()
      .regex(
        /^\/themes\/[a-z0-9]+(-[a-z0-9]+)*\/[a-z0-9]+(-[a-z0-9]+)*\.svg$/,
        "pattern.src must be /themes/<theme-id>/<name>.svg",
      ),
    /** Opacity of the texture over the page background. */
    strength: z.number().min(0.02).max(0.12),
    /** Tile size, e.g. "240px". */
    size: z
      .string()
      .regex(/^\d+px$/, "pattern.size must be pixels, e.g. 240px")
      .refine((s) => {
        const px = Number.parseInt(s, 10);
        return px >= 64 && px <= 512;
      }, "pattern.size must be between 64px and 512px"),
  })
  .strict();

export const themeSchema = z
  .object({
    $schema: z.string().optional(),
    id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "id must be kebab-case"),
    name: z.string().min(1),
    colorScheme: z.enum(["light", "dark"]),
    colors: record(COLOR_TOKENS, hexColor).strict(),
    fonts: z
      .object({
        display: z.enum(FONT_KEYS),
        body: z.enum(FONT_KEYS),
        /** Optional script font for the couple's names only; defaults to `display`. */
        script: z.enum(FONT_KEYS).optional(),
      })
      .strict(),
    radii: record(RADIUS_TOKENS, cssLength).strict(),
    shadows: record(SHADOW_TOKENS, z.string().min(1)).strict(),
    pattern: patternSchema.optional(),
  })
  .strict()
  .refine((theme) => !theme.pattern || theme.pattern.src.startsWith(`/themes/${theme.id}/`), {
    path: ["pattern", "src"],
    message: "pattern.src must live in the theme's own /themes/<id>/ folder",
  });

export type Theme = z.infer<typeof themeSchema>;
export type ColorScheme = Theme["colorScheme"];
/** The theme shown for each device colour scheme. */
export type ActiveThemes = Readonly<Record<ColorScheme, Theme>>;
