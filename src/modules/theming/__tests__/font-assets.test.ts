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
  declarations?: { prop: string; value: string }[];
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
const allConfigurations = mocks.local.mock.calls.map(([options]) => options);
const configurations = allConfigurations.filter(
  (options) => !options.variable.endsWith("-complete"),
);
const googleCalls = mocks.google.mock.calls.length;

it("loads every approved family from bundled fonts without the Google resolver", () => {
  expect(googleCalls).toBe(0);
  expect(configurations).toHaveLength(4);
  expect(
    fontVariables
      .split(" ")
      .filter((name) => !name.endsWith("-complete"))
      .sort(),
  ).toEqual(["--font-cormorant", "--font-inter", "--font-jost", "--font-playfair"]);
  for (const options of configurations) {
    expect(options.display).toBe("swap");
    expect(options.adjustFontFallback).toBe(false);
    expect(options.fallback).toHaveLength(1);
    for (const source of options.src) {
      expect(source.path).toContain("-latin.woff2");
      const bytes = readFileSync(resolve("src/modules/theming/components", source.path));
      expect(bytes.subarray(0, 4).toString()).toBe("wOF2");
    }
  }
});
it("preserves font ranges, styles, fallbacks and selective preloading", () => {
  const calls = Object.fromEntries(configurations.map((options) => [options.variable, options]));
  expect(calls["--font-cormorant"]).toMatchObject({
    fallback: ["var(--font-cormorant-complete)"],
    src: [
      { weight: "400 600", style: "normal" },
      { weight: "400 600", style: "italic" },
    ],
  });
  expect(calls["--font-inter"]).toMatchObject({
    fallback: ["var(--font-inter-complete)"],
    src: [{ weight: "100 900", style: "normal" }],
  });
  expect(calls["--font-jost"]).toMatchObject({
    preload: false,
    fallback: ["var(--font-jost-complete)"],
    src: [{ weight: "100 900", style: "normal" }],
  });
  expect(calls["--font-playfair"]).toMatchObject({
    preload: false,
    fallback: ["var(--font-playfair-complete)"],
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

it("retains complete character coverage without preloading full fonts for Latin text", () => {
  const complete = allConfigurations.filter((font) => font.variable.endsWith("-complete"));
  expect(complete).toHaveLength(4);
  for (const font of complete) {
    expect(font.preload).toBe(false);
    expect(font.fallback[0]).toContain("Metric Fallback");
    expect(font.declarations).toEqual([
      { prop: "unicode-range", value: "U+0100-1FFF, U+2070-209F, U+20D0-10FFFF" },
    ]);
  }
});

it("keeps all requested Latin characters in the primary subsets", () => {
  const result = execFileSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `
    import fs from "node:fs";
    import fontkit from "next/dist/compiled/@next/font/dist/fontkit/index.js";
    const parse=fontkit.default||fontkit;
    const names=["cormorant","cormorant-italic","inter","jost","playfair"];
    process.on("uncaughtException", error => { console.error(error.message); process.exit(1); });
    const latin=c => c<=255 || (c>=0x2000 && c<=0x206f) || (c>=0x20a0 && c<=0x20cf);
    console.log(JSON.stringify(names.map(name => {
      const full=parse(fs.readFileSync("src/modules/theming/fonts/"+name+".woff2"));
      const fast=parse(fs.readFileSync("src/modules/theming/fonts/"+name+"-latin.woff2"));
      const coverage=full.characterSet.filter(latin).every(c => fast.characterSet.includes(c));
      return {name,coverage};
    })));
  `,
    ],
    { encoding: "utf8" },
  );
  expect(JSON.parse(result)).toEqual(
    ["cormorant", "cormorant-italic", "inter", "jost", "playfair"].map((name) => ({
      name,
      coverage: true,
    })),
  );
});
