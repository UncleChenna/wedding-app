import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { loadTheme, ThemeValidationError } from "../lib/load-theme";
import { themes } from "../themes";
import { checkThemeContrast } from "../lib/contrast";
import lowContrast from "./fixtures/low-contrast.json" with { type: "json" };

const THEMES_DIR = join(import.meta.dirname, "../themes");
const themeFiles = readdirSync(THEMES_DIR).filter(
  (file) => file.endsWith(".json") && file !== "theme.schema.json",
);

describe("loadTheme", () => {
  it("rejects a theme that fails WCAG AA, naming the failing pairs", () => {
    expect(() => loadTheme(lowContrast)).toThrow(ThemeValidationError);
    expect(() => loadTheme(lowContrast)).toThrow(
      /fails WCAG AA contrast[\s\S]*foreground on background/,
    );
  });

  it("rejects a theme with a missing token", () => {
    const { primary: _primary, ...colors } = lowContrast.colors;
    expect(() => loadTheme({ ...lowContrast, colors })).toThrow(/colors\.primary/);
  });

  it("rejects non-hex colours and unknown fonts", () => {
    expect(() =>
      loadTheme({
        ...lowContrast,
        colors: { ...lowContrast.colors, background: "white" },
      }),
    ).toThrow(/6-digit hex/);
    expect(() =>
      loadTheme({
        ...lowContrast,
        fonts: { display: "comic-sans", body: "inter" },
      }),
    ).toThrow(/fonts\.display/);
  });
});

describe("theme registry", () => {
  it("has at least two themes with unique ids", () => {
    expect(themes.length).toBeGreaterThanOrEqual(2);
    expect(new Set(themes.map((t) => t.id)).size).toBe(themes.length);
  });

  it("registers every JSON file in themes/", () => {
    const registered = themes.map((t) => `${t.id}.json`).sort();
    expect(registered).toEqual([...themeFiles].sort());
  });

  it.each(themeFiles)("%s passes schema and WCAG AA", (file) => {
    const raw: unknown = JSON.parse(readFileSync(join(THEMES_DIR, file), "utf8"));
    const theme = loadTheme(raw);
    expect(`${theme.id}.json`).toBe(file);
    expect(checkThemeContrast(theme)).toEqual([]);
  });
});

describe("theme.schema.json", () => {
  it("is up to date with the Zod schema (run `pnpm themes:schema`)", async () => {
    const { renderThemeJsonSchema, THEME_SCHEMA_PATH } =
      await import("../../../../scripts/generate-theme-schema");
    expect(readFileSync(THEME_SCHEMA_PATH, "utf8")).toBe(renderThemeJsonSchema());
  });
});

const failedPairs = [
  "foreground on background",
  "foreground on surface",
  "foreground on surface-muted",
  "muted-foreground on background",
  "muted-foreground on surface",
  "primary on background",
  "primary on surface",
  "primary-foreground on primary",
  "input on surface",
  "ring on background",
  "ring on surface",
];

function assertContrastError(error: unknown) {
  expect(error).toBeInstanceOf(Error);
  const message = (error as Error).message;
  expect(message).toContain('Theme "low-contrast" fails WCAG AA contrast:');
  const lines = message.split("\n").slice(1);
  expect(lines).toHaveLength(failedPairs.length);
  for (const pair of failedPairs) {
    expect(lines.some((line) => line.startsWith(`  - ${pair}: `))).toBe(true);
  }
  expect(message).toContain("needs 4.5:1");
  expect(message).toContain("needs 3:1");
}

afterEach(() => {
  vi.doUnmock("../themes/ivory-gold.json");
  vi.resetModules();
});

describe("contrast gate at load time", () => {
  it("names the theme and all failing text and control pairs", () => {
    let caught: unknown;
    try {
      loadTheme(lowContrast);
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(ThemeValidationError);
    assertContrastError(caught);
  });

  it("rejects registry import when a registered theme fails contrast", async () => {
    vi.resetModules();
    vi.doMock("../themes/ivory-gold.json", () => ({ default: lowContrast }));
    let caught: unknown;
    try {
      await import("../themes");
    } catch (error) {
      caught = error;
    }
    assertContrastError(caught);
  });
});
