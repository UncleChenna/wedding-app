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

export const themeSchema = z
  .object({
    $schema: z.string().optional(),
    id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "id must be kebab-case"),
    name: z.string().min(1),
    colorScheme: z.enum(["light", "dark"]),
    colors: record(COLOR_TOKENS, hexColor).strict(),
    fonts: z.object({ display: z.enum(FONT_KEYS), body: z.enum(FONT_KEYS) }).strict(),
    radii: record(RADIUS_TOKENS, cssLength).strict(),
    shadows: record(SHADOW_TOKENS, z.string().min(1)).strict(),
  })
  .strict();

export type Theme = z.infer<typeof themeSchema>;
