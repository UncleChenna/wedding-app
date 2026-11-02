import { z } from "zod";
import ivoryGold from "../themes/ivory-gold.json" with { type: "json" };
import midnightChampagne from "../themes/midnight-champagne.json" with { type: "json" };
import { contrastRatio, hexToRgb } from "./contrast";
import { loadTheme } from "./load-theme";
import type { Theme } from "./schema";

const hex = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/)
  .transform((value) => value.toUpperCase());
const inputSchema = z
  .object({
    seed: hex,
    secondarySeed: hex.optional(),
    colorScheme: z.enum(["light", "dark"]).default("light"),
    id: z
      .string()
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)
      .optional(),
    name: z.string().trim().min(1).max(100).default("Our wedding"),
  })
  .strict();

export type GeneratedThemeResult = { ok: true; theme: Theme } | { ok: false; error: string };

function rgb(channels: readonly number[]): string {
  return (
    "#" +
    channels
      .map((value) => Math.round(value).toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
}

const black = rgb([0, 0, 0]);
const white = rgb([255, 255, 255]);

function mix(seed: string, target: string, amount: number): string {
  const from = hexToRgb(seed);
  const to = hexToRgb(target);
  return rgb(
    from.map((channel, index) => {
      // Both tuples have exactly three channels; map indexes are 0, 1 and 2.
      const targetChannel = to[index] ?? channel;
      return channel + (targetChannel - channel) * amount;
    }),
  );
}

/** Move towards an achromatic endpoint only as far as required for text contrast.
 * Check rounded output bytes, not an unrounded floating-point colour.
 */
function readable(seed: string, backgrounds: readonly string[], endpoint: string): string {
  for (let step = 0; step <= 255; step++) {
    const candidate = mix(seed, endpoint, step / 255);
    if (backgrounds.every((background) => contrastRatio(candidate, background) >= 4.5))
      return candidate;
  }
  throw new Error("The palette's neutral surfaces cannot support readable text.");
}

function foreground(background: string): string {
  return contrastRatio(black, background) >= contrastRatio(white, background) ? black : white;
}

/** Pure draft generation: no persistence, registry mutation or automatic activation.
 * Neutral surfaces and all status tokens come from the approved scheme baseline.
 * Seed colours remain exact decorative fills; text/control versions are adjusted for AA.
 */
export function generateTheme(input: unknown): GeneratedThemeResult {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      error:
        "Choose one or two six-digit hex colours, a light or dark appearance, and a valid theme name and ID.",
    };
  const { seed, secondarySeed = seed, colorScheme, id, name } = parsed.data;
  const base = loadTheme(colorScheme === "light" ? ivoryGold : midnightChampagne);
  const endpoint = colorScheme === "light" ? black : white;
  const surfaces = [base.colors.background, base.colors.surface];
  const primary = readable(seed, surfaces, endpoint);
  const accent = readable(secondarySeed, surfaces, endpoint);
  const secondary = mix(secondarySeed, base.colors.surface, 0.9);
  const body = readable(
    mix(seed, endpoint, 0.85),
    [...surfaces, base.colors["surface-muted"]],
    endpoint,
  );
  const colors: Theme["colors"] = {
    ...base.colors,
    foreground: body,
    "muted-foreground": readable(mix(seed, endpoint, 0.4), surfaces, endpoint),
    primary,
    "primary-foreground": foreground(primary),
    secondary,
    "secondary-foreground": foreground(secondary),
    accent,
    "accent-foreground": foreground(accent),
    border: mix(seed, base.colors.surface, 0.8),
    input: primary,
    ring: primary,
    decorative: secondarySeed,
    "decorative-foreground": foreground(secondarySeed),
  };
  return {
    ok: true,
    theme: loadTheme({
      id: id ?? `generated-${colorScheme}`,
      name,
      colorScheme,
      colors,
      fonts: base.fonts,
      radii: base.radii,
      shadows: base.shadows,
    }),
  };
}
