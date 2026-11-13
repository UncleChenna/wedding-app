vi.mock("@/modules/shared/lib/env/client", () => ({
  clientEnv: { NEXT_PUBLIC_SITE_URL: "https://wedding.example" },
}));
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { themes } from "@/modules/theming/themes";
import { getTheme } from "@/modules/theming/lib/registry";
import copy from "../lib/offline-copy.json";
import manifest from "../lib/offline-fonts.json";
import { offlineDocument } from "../server/offline-document";

describe("bounded public offline document", () => {
  it.each(themes)("preserves $id tokens and intended fonts without a Next bootstrap", (theme) => {
    const html = offlineDocument({ light: theme, dark: theme });
    expect(html).toContain(copy.heading);
    expect(html).toContain(theme.colors.background);
    expect(html).toContain(`--font-${theme.fonts.display}`);
    expect(html).toContain(`--font-${theme.fonts.body}`);
    expect(html).not.toContain("/_next/");
    expect(html).not.toContain("self.__next");
    expect(html).toContain('id="offline-retry"');
    expect(html).toContain('href="/"');
    for (const face of manifest.fonts) expect(html).toContain(face.path);
  });
  it("pins generated assets and covers every rendered copy character including uppercase labels", () => {
    expect(manifest.fallbackCss).toBe(
      readFileSync("src/modules/theming/font-fallbacks.css", "utf8"),
    );
    const needed = new Set(Object.values(copy).join("") + copy.eyebrow.toUpperCase());
    for (const char of needed) expect(manifest.characters).toContain(char);
    for (const face of manifest.fonts) {
      expect(face.weight).toBe("400 600");
      expect(createHash("sha256").update(readFileSync(face.sourceFile)).digest("hex")).toBe(
        face.sourceSha256,
      );
      const bytes = readFileSync(`public${face.path}`);
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(face.sha256);
      expect(bytes.length).toBe(face.bytes);
    }
  });
  it("supports valid custom role assignments without forcing display fonts to a single weight", () => {
    const custom = {
      ...getTheme("ivory-gold"),
      fonts: { display: "inter" as const, body: "playfair" as const },
    };
    const html = offlineDocument({ light: custom, dark: custom });
    expect(html).toContain("--font-playfair");
    expect(html).toContain("font-weight:400 600");
  });
});
