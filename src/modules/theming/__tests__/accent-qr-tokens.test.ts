import { describe, expect, it } from "vitest";

import { checkQrPolarity, checkThemeContrast, contrastRatio } from "../lib/contrast";
import { loadTheme } from "../lib/load-theme";
import { getTheme } from "../lib/registry";
import { themes } from "../themes";

const ivory = getTheme("ivory-gold");

describe("decorative and QR tokens", () => {
  it("uses the approved ivory, champagne and chocolate in Ivory & Gold", () => {
    expect(ivory.colors).toMatchObject({
      decorative: "#D6BE8D",
      "decorative-foreground": "#432B22",
      "qr-ink": "#432B22",
      "qr-paper": "#FFF9EF",
    });
  });

  it("never uses champagne as body text: it fails AA on the page", () => {
    expect(contrastRatio(ivory.colors.decorative, ivory.colors.background)).toBeLessThan(4.5);
  });

  it.each(themes.map((theme) => [theme.id, theme] as const))(
    "%s has a dark-on-light QR with AA contrast",
    (_id, theme) => {
      expect(checkQrPolarity(theme)).toBeNull();
      expect(contrastRatio(theme.colors["qr-ink"], theme.colors["qr-paper"])).toBeGreaterThan(4.5);
    },
  );

  it("rejects text on the decorative fill that fails AA", () => {
    const colors = { ...ivory.colors, "decorative-foreground": "#B8A47A" };
    expect(checkThemeContrast({ colors })).toContainEqual(
      expect.objectContaining({ foreground: "decorative-foreground", background: "decorative" }),
    );
    expect(() => loadTheme({ ...ivory, colors })).toThrow(/decorative-foreground on decorative/);
  });

  it("rejects a low-contrast QR", () => {
    const colors = { ...ivory.colors, "qr-ink": "#C9B9A0" };
    expect(() => loadTheme({ ...ivory, colors })).toThrow(/qr-ink on qr-paper/);
  });

  it("rejects a light-on-dark QR even when the contrast is high", () => {
    const colors = { ...ivory.colors, "qr-ink": "#FFFFFF", "qr-paper": "#111111" };
    expect(checkQrPolarity({ colors })).toMatch(/darker than qr-paper/);
    expect(() => loadTheme({ ...ivory, colors })).toThrow(/unscannable QR/);
  });
});
