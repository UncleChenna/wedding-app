import { Cormorant_Garamond, Inter, Jost, Playfair_Display } from "next/font/google";

import type { FontKey } from "../lib/schema";

import "../font-fallbacks.css";

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
  // The automatic face only names Times New Roman, which may be absent on Linux.
  // Our metric-compatible local face also supports Liberation Serif.
  adjustFontFallback: false,
  fallback: ["Cormorant Metric Fallback"],
});
// Alternate-theme fonts remain available on demand without competing with the
// default invitation fonts during the first page load.
const playfair = Playfair_Display({
  preload: false,
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  adjustFontFallback: false,
  fallback: ["Playfair Metric Fallback"],
});
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  adjustFontFallback: false,
  fallback: ["Inter Metric Fallback"],
});
const jost = Jost({
  preload: false,
  subsets: ["latin"],
  variable: "--font-jost",
  display: "swap",
  adjustFontFallback: false,
  fallback: ["Jost Metric Fallback"],
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
