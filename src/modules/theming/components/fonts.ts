import { Cormorant_Garamond, Inter, Jost, Playfair_Display } from "next/font/google";

import type { FontKey } from "../lib/schema";

/**
 * Font registry. Each font exposes `--font-<key>`, which themes reference by
 * key. To add a font: load it here, then add its key to FONT_KEYS in lib/schema.ts.
 */
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
const jost = Jost({
  subsets: ["latin"],
  variable: "--font-jost",
  display: "swap",
});

const fonts: Record<FontKey, { variable: string }> = {
  cormorant,
  playfair,
  inter,
  jost,
};

/** Class names that define every `--font-<key>` variable. Apply to <html>. */
export const fontVariables = Object.values(fonts)
  .map((font) => font.variable)
  .join(" ");
