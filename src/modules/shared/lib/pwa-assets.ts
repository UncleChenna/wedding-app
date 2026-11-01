import type { Metadata, MetadataRoute } from "next";

export const iconThemeIds = [
  "ivory-gold",
  "midnight-champagne",
  "emerald-night",
  "blush-sage",
] as const;
export const startupDevices = [
  { width: 375, height: 667, ratio: 2 },
  { width: 390, height: 844, ratio: 3 },
  { width: 393, height: 852, ratio: 3 },
  { width: 430, height: 932, ratio: 3 },
  { width: 768, height: 1024, ratio: 2 },
  { width: 820, height: 1180, ratio: 2 },
] as const;
export function iconTheme(id: string) {
  return iconThemeIds.find((value) => value === id) ?? "ivory-gold";
}
export function installationIcons(id: string): NonNullable<MetadataRoute.Manifest["icons"]> {
  const theme = iconTheme(id);
  return [192, 512].flatMap((size) =>
    (["any", "maskable"] as const).map((purpose) => ({
      src: `/icons/${theme}/${purpose}-${size}.png`,
      sizes: `${size}x${size}`,
      type: "image/png",
      purpose,
    })),
  );
}
export function startupImages(id: string) {
  return startupDevices.flatMap((device) =>
    (["portrait", "landscape"] as const).map((orientation) => {
      const width = (orientation === "portrait" ? device.width : device.height) * device.ratio;
      const height = (orientation === "portrait" ? device.height : device.width) * device.ratio;
      return {
        url: `/icons/${iconTheme(id)}/startup-${width}x${height}.png`,
        media: `(device-width: ${device.width}px) and (device-height: ${device.height}px) and (-webkit-device-pixel-ratio: ${device.ratio}) and (orientation: ${orientation})`,
      };
    }),
  );
}
export function installationMetadata(id: string): Metadata {
  return {
    icons: {
      apple: [
        { url: `/icons/${iconTheme(id)}/apple-touch-180.png`, sizes: "180x180", type: "image/png" },
      ],
    },
    appleWebApp: { capable: true, statusBarStyle: "default", startupImage: startupImages(id) },
    // Next emits the standard mobile-web-app-capable; Apple startup images also need this legacy name.
    other: { "apple-mobile-web-app-capable": "yes" },
  };
}
