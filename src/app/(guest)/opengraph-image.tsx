import { ImageResponse } from "next/og";
import { getActiveTheme } from "@/modules/theming";

export const alt = "Uchenna and Adaora — 19 December 2026";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function WeddingPreviewImage() {
  const theme = getActiveTheme();
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        background: theme.colors.background,
        color: theme.colors.foreground,
      }}
    >
      <div style={{ display: "flex", fontSize: 72 }}>Uchenna &amp; Adaora</div>
      <div style={{ display: "flex", marginTop: 36, fontSize: 32, color: theme.colors.primary }}>
        19 December 2026
      </div>
    </div>,
    size,
  );
}
