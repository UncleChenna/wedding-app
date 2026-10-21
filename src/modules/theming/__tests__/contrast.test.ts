import { describe, expect, it } from "vitest";

import { checkThemeContrast, contrastRatio, hexToRgb, relativeLuminance } from "../lib/contrast";
import lowContrast from "./fixtures/low-contrast.json" with { type: "json" };

describe("contrast", () => {
  it("parses hex colours", () => {
    expect(hexToRgb("#1A2B3C")).toEqual([26, 43, 60]);
    expect(() => hexToRgb("red")).toThrow(/Invalid hex/);
  });

  it("computes WCAG relative luminance", () => {
    expect(relativeLuminance("#000000")).toBe(0);
    expect(relativeLuminance("#FFFFFF")).toBe(1);
  });

  it("computes contrast ratios symmetrically", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
    expect(contrastRatio("#FFFFFF", "#000000")).toBeCloseTo(21, 5);
    expect(contrastRatio("#777777", "#FFFFFF")).toBeCloseTo(4.48, 2);
  });

  it("does not round a near-miss up to a pass", () => {
    // #777777 on white is 4.48:1, just under AA.
    const failures = checkThemeContrast({
      colors: {
        ...lowContrast.colors,
        foreground: "#777777",
        background: "#FFFFFF",
      },
    });
    expect(
      failures.some((f) => f.foreground === "foreground" && f.background === "background"),
    ).toBe(true);
  });

  it("reports every failing pair with ratio and requirement", () => {
    const failures = checkThemeContrast(lowContrast);
    const pairs = failures.map((f) => `${f.foreground}/${f.background}`);
    expect(pairs).toEqual(
      expect.arrayContaining([
        "foreground/background",
        "muted-foreground/background",
        "primary-foreground/primary",
        "input/surface",
        "ring/background",
      ]),
    );
    for (const failure of failures) expect(failure.ratio).toBeLessThan(failure.required);
  });
});
