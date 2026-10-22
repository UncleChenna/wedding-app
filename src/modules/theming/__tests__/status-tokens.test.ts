import { describe, expect, it } from "vitest";

import { CONTRAST_PAIRS } from "../lib/contrast";
import { loadTheme } from "../lib/load-theme";
import { COLOR_TOKENS } from "../lib/schema";
import {
  STATUS_HUE_RANGES,
  STATUS_KINDS,
  STATUS_TOKENS,
  checkStatusHues,
  hueOf,
  inHueRange,
} from "../lib/status";
import { themes } from "../themes";

describe("semantic status tokens", () => {
  it("defines solid, foreground, subtle and subtle-foreground tokens for valid, used and invalid", () => {
    expect(STATUS_KINDS).toEqual(["success", "warning", "danger"]);
    for (const kind of STATUS_KINDS)
      for (const token of [
        kind,
        `${kind}-foreground`,
        `${kind}-subtle`,
        `${kind}-subtle-foreground`,
      ])
        expect(COLOR_TOKENS).toContain(token);
    expect(STATUS_TOKENS).toHaveLength(12);
  });

  it("puts every status text pair through the AA contrast gate", () => {
    const pairs = CONTRAST_PAIRS.map(([fg, bg, ratio]) => `${fg}/${bg}/${ratio}`);
    for (const kind of STATUS_KINDS) {
      expect(pairs).toContain(`${kind}-foreground/${kind}/4.5`);
      expect(pairs).toContain(`${kind}-subtle-foreground/${kind}-subtle/4.5`);
      expect(pairs).toContain(`${kind}-subtle-foreground/surface/4.5`);
      expect(pairs).toContain(`${kind}/surface/3`);
    }
  });

  it("every registered theme defines every status token", () => {
    for (const theme of themes)
      for (const token of STATUS_TOKENS)
        expect(theme.colors[token], `${theme.id} ${token}`).toMatch(/^#/);
  });
});

describe("status hue ranges", () => {
  it("computes HSL hue in degrees", () => {
    expect(hueOf("#FF0000")).toBeCloseTo(0, 5);
    expect(hueOf("#00FF00")).toBeCloseTo(120, 5);
    expect(hueOf("#FFBF00")).toBeCloseTo(45, 0);
  });

  it("handles red's range wrapping around 0°", () => {
    expect(inHueRange(355, STATUS_HUE_RANGES.danger)).toBe(true);
    expect(inHueRange(8, STATUS_HUE_RANGES.danger)).toBe(true);
    expect(inHueRange(40, STATUS_HUE_RANGES.danger)).toBe(false);
  });

  it("keeps every registered theme's statuses green, amber and red", () => {
    for (const theme of themes) expect(checkStatusHues(theme), theme.id).toEqual([]);
  });

  it("rejects a theme whose 'valid' colour is not green, naming the token", () => {
    const base = themes[0];
    if (!base) throw new Error("no themes registered");
    const blue = { ...base, id: "blue-success", colors: { ...base.colors, success: "#1D4ED8" } };
    expect(checkStatusHues(blue).map((f) => f.token)).toContain("success");
    expect(() => loadTheme(blue)).toThrow(/success[\s\S]*green/);
  });

  it("rejects a near-grey status colour whose hue is not meaningful", () => {
    const base = themes[0];
    if (!base) throw new Error("no themes registered");
    const grey = { ...base, id: "grey-warning", colors: { ...base.colors, warning: "#6B6862" } };
    expect(checkStatusHues(grey).map((f) => f.token)).toContain("warning");
  });
});
