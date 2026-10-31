import { expect, it, vi } from "vitest";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

type FontOptions = {
  variable: string;
  display: string;
  preload?: boolean;
  adjustFontFallback: boolean;
  fallback: string[];
  src: { path: string; weight: string; style: string }[];
};
const mocks = vi.hoisted(() => ({
  local: vi.fn((options: FontOptions) => ({ variable: options.variable })),
  google: vi.fn(() => ({ variable: "remote-font" })),
}));
vi.mock("next/font/local", () => ({ default: mocks.local }));
vi.mock("next/font/google", () => ({
  Cormorant_Garamond: mocks.google,
  Inter: mocks.google,
  Jost: mocks.google,
  Playfair_Display: mocks.google,
}));
import { fontVariables } from "../components/fonts";

// Capture module initialization before the suite clears mocks between tests.
const configurations = mocks.local.mock.calls.map(([options]) => options);
const googleCalls = mocks.google.mock.calls.length;

it("loads every approved family from bundled fonts without the Google resolver", () => {
  expect(googleCalls).toBe(0);
  expect(configurations).toHaveLength(4);
  expect(fontVariables.split(" ").sort()).toEqual([
    "--font-cormorant",
    "--font-inter",
    "--font-jost",
    "--font-playfair",
  ]);
  for (const options of configurations) {
    expect(options.display).toBe("swap");
    expect(options.adjustFontFallback).toBe(false);
    expect(options.fallback).toHaveLength(1);
    for (const source of options.src) {
      const bytes = readFileSync(resolve("src/modules/theming/components", source.path));
      expect(bytes.subarray(0, 4).toString()).toBe("wOF2");
    }
  }
});
it("preserves font ranges, styles, fallbacks and selective preloading", () => {
  const calls = Object.fromEntries(configurations.map((options) => [options.variable, options]));
  expect(calls["--font-cormorant"]).toMatchObject({
    fallback: ["Cormorant Metric Fallback"],
    src: [
      { weight: "400 600", style: "normal" },
      { weight: "400 600", style: "italic" },
    ],
  });
  expect(calls["--font-inter"]).toMatchObject({
    fallback: ["Inter Metric Fallback"],
    src: [{ weight: "100 900", style: "normal" }],
  });
  expect(calls["--font-jost"]).toMatchObject({
    preload: false,
    fallback: ["Jost Metric Fallback"],
    src: [{ weight: "100 900", style: "normal" }],
  });
  expect(calls["--font-playfair"]).toMatchObject({
    preload: false,
    fallback: ["Playfair Metric Fallback"],
    src: [{ weight: "400 900", style: "normal" }],
  });
});

it("ships the approved families with full glyph sets and no automatic optical-size axis", () => {
  const result = execFileSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `
    import fs from "node:fs";
    import fontkit from "next/dist/compiled/@next/font/dist/fontkit/index.js";
    const parse = fontkit.default || fontkit;
    const fonts = ["cormorant", "cormorant-italic", "inter", "jost", "playfair"];
    console.log(JSON.stringify(fonts.map(name => {
      const font = parse(fs.readFileSync("src/modules/theming/fonts/" + name + ".woff2"));
      return { name, family: font.familyName, glyphs: font.numGlyphs, axes: Object.keys(font.variationAxes) };
    })));
  `,
    ],
    { encoding: "utf8" },
  );
  expect(JSON.parse(result)).toEqual([
    { name: "cormorant", family: "Cormorant Garamond Light", glyphs: 3241, axes: ["wght"] },
    { name: "cormorant-italic", family: "Cormorant Garamond Light", glyphs: 1895, axes: ["wght"] },
    { name: "inter", family: "Inter", glyphs: 2933, axes: ["wght"] },
    { name: "jost", family: "Jost", glyphs: 535, axes: ["wght"] },
    { name: "playfair", family: "Playfair Display", glyphs: 1103, axes: ["wght"] },
  ]);
});
