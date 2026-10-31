import localFont from "next/font/local";

import type { FontKey } from "../lib/schema";

import "../font-fallbacks.css";

/**
 * Font registry. Each font exposes `--font-<key>`, which themes reference by
 * key. To add a font: load it here, then add its key to FONT_KEYS in lib/schema.ts.
 */
const cormorant = localFont({
  src: [
    { path: "../fonts/cormorant.woff2", weight: "400 600", style: "normal" },
    { path: "../fonts/cormorant-italic.woff2", weight: "400 600", style: "italic" },
  ],
  variable: "--font-cormorant",
  display: "swap",
  // The automatic face only names Times New Roman, which may be absent on Linux.
  // Our metric-compatible local face also supports Liberation Serif.
  adjustFontFallback: false,
  fallback: ["Cormorant Metric Fallback"],
});
// Alternate-theme fonts remain available on demand without competing with the
// default invitation fonts during the first page load.
const playfair = localFont({
  src: [{ path: "../fonts/playfair.woff2", weight: "400 900", style: "normal" }],
  preload: false,
  variable: "--font-playfair",
  display: "swap",
  adjustFontFallback: false,
  fallback: ["Playfair Metric Fallback"],
});
const inter = localFont({
  src: [{ path: "../fonts/inter.woff2", weight: "100 900", style: "normal" }],
  variable: "--font-inter",
  display: "swap",
  adjustFontFallback: false,
  fallback: ["Inter Metric Fallback"],
});
const jost = localFont({
  src: [{ path: "../fonts/jost.woff2", weight: "100 900", style: "normal" }],
  preload: false,
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
