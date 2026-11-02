import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { buildWeddingManifest } from "@/modules/shared/lib/manifest";
import { getManifestCoupleNames } from "@/modules/shared/server/manifest-names";
import { getStoredActiveThemes } from "@/modules/theming/server/active-themes";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  // Request-time rendering prevents the build from pinning installation branding.
  await connection();
  const [names, themes] = await Promise.all([getManifestCoupleNames(), getStoredActiveThemes()]);
  // Manifest branding has no device appearance context; page chrome remains device-aware.
  return buildWeddingManifest(names, themes.light);
}
