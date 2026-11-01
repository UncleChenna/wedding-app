import { ImageResponse } from "next/og";
import { connection } from "next/server";
import { getStoredActiveThemes } from "@/modules/theming/server/active-themes";
import { getEventSettings } from "@/modules/shared/server/settings";
import { eventSummary } from "@/modules/invitations/lib/event-summary";

export const alt = "Our wedding celebration";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function WeddingPreviewImage() {
  await connection();
  const summary = eventSummary(await getEventSettings());
  const { light: theme } = await getStoredActiveThemes();
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
      <div style={{ display: "flex", fontSize: 72 }}>{summary.title}</div>
      <div style={{ display: "flex", marginTop: 36, fontSize: 32, color: theme.colors.primary }}>
        {summary.date}
      </div>
    </div>,
    size,
  );
}
