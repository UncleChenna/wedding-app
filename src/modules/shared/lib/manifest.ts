import type { MetadataRoute } from "next";
import type { Theme } from "@/modules/theming";

/** Only public event identity belongs here, never invitation or staff state. */
export function buildWeddingManifest(
  coupleNames: readonly [string, string],
  theme: Theme,
): MetadataRoute.Manifest {
  return {
    id: "/",
    name: coupleNames.join(" & ") + " — Our wedding",
    short_name: coupleNames.map((name) => Array.from(name)[0]).join(" & "),
    description: "Our wedding celebration.",
    lang: "en",
    start_url: "/",
    scope: "/",
    display: "standalone",
    theme_color: theme.colors.primary,
    background_color: theme.colors.background,
  };
}
