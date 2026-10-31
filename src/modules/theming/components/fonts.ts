import localFont from "next/font/local";

import type { FontKey } from "../lib/schema";

import "../font-fallbacks.css";

/**
 * Primary subsets keep first paint small; complete faces cover other code points.
 * Complementary unicode ranges prevent full-font downloads during Latin swaps.
 * Font registry. Each font exposes `--font-<key>`, which themes reference by
 * key. To add a font: load it here, then add its key to FONT_KEYS in lib/schema.ts.
 */
const cormorantComplete = localFont({
  preload: false,
  src: [
    { path: "../fonts/cormorant.woff2", weight: "400 600", style: "normal" },
    { path: "../fonts/cormorant-italic.woff2", weight: "400 600", style: "italic" },
  ],
  variable: "--font-cormorant-complete",
  display: "swap",
  // The automatic face only names Times New Roman, which may be absent on Linux.
  // Our metric-compatible local face also supports Liberation Serif.
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-1FFF, U+2070-209F, U+20D0-10FFFF" }],
  fallback: ["Cormorant Metric Fallback"],
});

const cormorant = localFont({
  src: [
    { path: "../fonts/cormorant-latin.woff2", weight: "400 600", style: "normal" },
    { path: "../fonts/cormorant-italic-latin.woff2", weight: "400 600", style: "italic" },
  ],
  variable: "--font-cormorant",
  display: "swap",
  // The automatic face only names Times New Roman, which may be absent on Linux.
  // Our metric-compatible local face also supports Liberation Serif.
  adjustFontFallback: false,
  fallback: ["var(--font-cormorant-complete)"],
});
// Alternate-theme fonts remain available on demand without competing with the
// default invitation fonts during the first page load.
const playfairComplete = localFont({
  src: [{ path: "../fonts/playfair.woff2", weight: "400 900", style: "normal" }],
  preload: false,
  variable: "--font-playfair-complete",
  display: "swap",
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-1FFF, U+2070-209F, U+20D0-10FFFF" }],
  fallback: ["Playfair Metric Fallback"],
});

const playfair = localFont({
  src: [{ path: "../fonts/playfair-latin.woff2", weight: "400 900", style: "normal" }],
  preload: false,
  variable: "--font-playfair",
  display: "swap",
  adjustFontFallback: false,
  fallback: ["var(--font-playfair-complete)"],
});
const interComplete = localFont({
  preload: false,
  src: [{ path: "../fonts/inter.woff2", weight: "100 900", style: "normal" }],
  variable: "--font-inter-complete",
  display: "swap",
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-1FFF, U+2070-209F, U+20D0-10FFFF" }],
  fallback: ["Inter Metric Fallback"],
});

const inter = localFont({
  src: [{ path: "../fonts/inter-latin.woff2", weight: "100 900", style: "normal" }],
  variable: "--font-inter",
  display: "swap",
  adjustFontFallback: false,
  fallback: ["var(--font-inter-complete)"],
});
const jostComplete = localFont({
  src: [{ path: "../fonts/jost.woff2", weight: "100 900", style: "normal" }],
  preload: false,
  variable: "--font-jost-complete",
  display: "swap",
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-1FFF, U+2070-209F, U+20D0-10FFFF" }],
  fallback: ["Jost Metric Fallback"],
});

const jost = localFont({
  src: [{ path: "../fonts/jost-latin.woff2", weight: "100 900", style: "normal" }],
  preload: false,
  variable: "--font-jost",
  display: "swap",
  adjustFontFallback: false,
  fallback: ["var(--font-jost-complete)"],
});

const fonts: Record<FontKey, { variable: string }> = {
  cormorant,
  playfair,
  inter,
  jost,
};

/** Class names that define every `--font-<key>` variable. Apply to <html>. */
export const fontVariables = Object.values(fonts)
  .concat([cormorantComplete, playfairComplete, interComplete, jostComplete])
  .map((font) => font.variable)
  .join(" ");
