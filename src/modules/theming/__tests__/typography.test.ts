import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { themeSchema } from "../lib/schema";
import { themeToCssVars } from "../lib/css-vars";
import { TYPE_STYLES } from "../lib/typography";
import { themes } from "../themes";

const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

/** The declarations inside `@utility <name> { ... }` (no nested blocks are used). */
function utility(name: string): Record<string, string> {
  const match = new RegExp(`@utility ${name} \\{([^}]*)\\}`).exec(css);
  if (!match?.[1]) throw new Error(`@utility ${name} missing from globals.css`);
  return Object.fromEntries(
    match[1]
      .split(";")
      .map((d) => d.trim())
      .filter(Boolean)
      .map((d) => {
        const i = d.indexOf(":");
        return [d.slice(0, i).trim(), d.slice(i + 1).trim()];
      }),
  );
}

/** Evaluate a clamp(min, a rem + b vw, max) at a viewport width, in px. */
function clampPx(value: string, viewport: number): number {
  const m = /clamp\(([\d.]+)rem,\s*([\d.]+)rem \+ ([\d.]+)vw,\s*([\d.]+)rem\)/.exec(value);
  if (!m) return Number.parseFloat(value) * (value.endsWith("rem") ? 16 : 1);
  const [min, base, vw, max] = m.slice(1).map(Number) as [number, number, number, number];
  return Math.min(max * 16, Math.max(min * 16, base * 16 + (vw * viewport) / 100));
}

describe("typography scale", () => {
  it("defines a CSS utility for every named style", () => {
    for (const style of TYPE_STYLES) expect(() => utility(style.className)).not.toThrow();
  });

  it("headings are ≥32px at 375px and ≥48px at 1280px, with -0.02em…0 tracking", () => {
    for (const name of ["type-display", "type-heading"]) {
      const u = utility(name);
      expect(clampPx(u["font-size"] ?? "", 375), name).toBeGreaterThanOrEqual(32);
      expect(clampPx(u["font-size"] ?? "", 1280), name).toBeGreaterThanOrEqual(48);
      const tracking = Number.parseFloat(u["letter-spacing"] ?? "0");
      expect(tracking).toBeGreaterThanOrEqual(-0.02);
      expect(tracking).toBeLessThanOrEqual(0);
    }
  });

  it("body text is ≥16px with line-height 1.5–1.7", () => {
    for (const name of ["type-body", "type-body-lg"]) {
      const u = utility(name);
      expect(clampPx(u["font-size"] ?? "", 375), name).toBeGreaterThanOrEqual(16);
      const lh = Number(u["line-height"]);
      expect(lh).toBeGreaterThanOrEqual(1.5);
      expect(lh).toBeLessThanOrEqual(1.7);
    }
  });

  it("labels are uppercase with 0.08–0.15em tracking", () => {
    const u = utility("type-label");
    expect(u["text-transform"]).toBe("uppercase");
    const tracking = Number.parseFloat(u["letter-spacing"] ?? "0");
    expect(tracking).toBeGreaterThanOrEqual(0.08);
    expect(tracking).toBeLessThanOrEqual(0.15);
  });

  it("staff text is ≥18px and staff identifiers ≥32px", () => {
    expect(clampPx(utility("type-staff")["font-size"] ?? "", 375)).toBeGreaterThanOrEqual(18);
    expect(clampPx(utility("type-staff-id")["font-size"] ?? "", 375)).toBeGreaterThanOrEqual(32);
  });

  it("the script role is only for the couple's names and falls back to the display font", () => {
    expect(utility("type-script")["font-family"]).toContain("var(--font-script)");
    expect(css).toMatch(/--font-script:\s*var\(--t-font-script, var\(--t-font-display\)\)/);
    const script = TYPE_STYLES.find((s) => s.className === "type-script");
    expect(script?.use).toMatch(/couple's names only/i);
  });
});

describe("optional script font in themes", () => {
  it("emits --t-font-script only when a theme sets fonts.script", () => {
    const base = themes[0];
    if (!base) throw new Error("no themes");
    expect(
      themeToCssVars({ ...base, fonts: { ...base.fonts } })["--t-font-script"],
    ).toBeUndefined();
    const withScript = themeSchema.parse({
      ...base,
      fonts: { ...base.fonts, script: "cormorant" },
    });
    expect(themeToCssVars(withScript)["--t-font-script"]).toBe("var(--font-cormorant)");
  });

  it("rejects a script font outside the curated list", () => {
    const base = themes[0];
    if (!base) throw new Error("no themes");
    expect(
      themeSchema.safeParse({ ...base, fonts: { ...base.fonts, script: "comic-sans" } }).success,
    ).toBe(false);
  });
});
