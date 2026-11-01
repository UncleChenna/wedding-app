import { describe, expect, it } from "vitest";
import { getTheme } from "@/modules/theming";
import { buildWeddingManifest } from "../lib/manifest";

describe("wedding manifest", () => {
  it("uses public couple names and a short initial label", () => {
    const manifest = buildWeddingManifest(["Uchenna", "Adaora"], getTheme("ivory-gold"));
    expect(manifest).toMatchObject({
      name: "Uchenna & Adaora — Our wedding",
      short_name: "U & A",
      id: "/",
      start_url: "/",
      scope: "/",
      display: "standalone",
      lang: "en",
    });
    expect(manifest.icons).toHaveLength(4);
    expect(manifest.icons).toContainEqual({
      src: "/icons/ivory-gold/maskable-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable",
    });
  });
  it("changes theme colours without changing app identity or launch target", () => {
    const first = buildWeddingManifest(["Uchenna", "Adaora"], getTheme("ivory-gold"));
    const second = buildWeddingManifest(["Uchenna", "Adaora"], getTheme("blush-sage"));
    expect(second.theme_color).toBe(getTheme("blush-sage").colors.primary);
    expect(second.background_color).toBe(getTheme("blush-sage").colors.background);
    expect(second.theme_color).not.toBe(first.theme_color);
    expect([second.id, second.scope, second.start_url]).toEqual([
      first.id,
      first.scope,
      first.start_url,
    ]);
  });
  it("supports stored names and Unicode initials", () => {
    const manifest = buildWeddingManifest(["Élodie", "Ada"], getTheme("emerald-night"));
    expect(manifest.name).toContain("Élodie & Ada");
    expect(manifest.short_name).toBe("É & A");
    expect(manifest.start_url).not.toMatch(/i\/|checkin|token|staff/);
  });
});
