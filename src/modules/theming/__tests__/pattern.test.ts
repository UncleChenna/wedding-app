import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { themeToCssVars } from "../lib/css-vars";
import { themeSchema, type Theme } from "../lib/schema";
import { themes } from "../themes";

const base = themes.find((t) => t.id === "midnight-champagne");
if (!base) throw new Error("midnight-champagne theme missing");
const withPattern = (pattern: unknown) => ({ ...base, pattern });

describe("theme pattern texture (THM-1)", () => {
  it("is optional: a theme without a pattern is valid and emits no pattern variables", () => {
    const parsed = themeSchema.parse({ ...base, pattern: undefined });
    expect(parsed.pattern).toBeUndefined();
    const vars = themeToCssVars(parsed);
    expect(Object.keys(vars).some((k) => k.startsWith("--t-pattern"))).toBe(false);
  });

  it("accepts a pattern under the theme's own /themes/<id>/ folder with bounded strength and size", () => {
    const parsed = themeSchema.parse(
      withPattern({ src: "/themes/midnight-champagne/paper.svg", strength: 0.05, size: "240px" }),
    );
    expect(themeToCssVars(parsed)).toMatchObject({
      "--t-pattern-image": 'url("/themes/midnight-champagne/paper.svg")',
      "--t-pattern-opacity": "0.05",
      "--t-pattern-size": "240px",
    });
  });

  it.each([
    ["an external URL", { src: "https://evil.example/p.svg", strength: 0.05, size: "240px" }],
    [
      "another theme's folder",
      { src: "/themes/ivory-gold/paper.svg", strength: 0.05, size: "240px" },
    ],
    [
      "a path escape",
      { src: "/themes/midnight-champagne/../x.svg", strength: 0.05, size: "240px" },
    ],
    [
      "a raster image",
      { src: "/themes/midnight-champagne/paper.png", strength: 0.05, size: "240px" },
    ],
    [
      "strength too strong for text contrast",
      { src: "/themes/midnight-champagne/p.svg", strength: 0.2, size: "240px" },
    ],
    [
      "strength too faint to matter",
      { src: "/themes/midnight-champagne/p.svg", strength: 0.005, size: "240px" },
    ],
    [
      "a tile size out of range",
      { src: "/themes/midnight-champagne/p.svg", strength: 0.05, size: "8px" },
    ],
  ])("rejects %s", (_label, pattern) => {
    expect(themeSchema.safeParse(withPattern(pattern)).success).toBe(false);
  });

  it("every registered theme's pattern file exists in public/", () => {
    for (const theme of themes as readonly Theme[]) {
      if (!theme.pattern) continue;
      expect(existsSync(join(process.cwd(), "public", theme.pattern.src)), theme.id).toBe(true);
    }
  });

  it("at least one shipped theme uses a pattern and at least one does not", () => {
    expect(themes.some((t) => t.pattern)).toBe(true);
    expect(themes.some((t) => !t.pattern)).toBe(true);
  });
});
