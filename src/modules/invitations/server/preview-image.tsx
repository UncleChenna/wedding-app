import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import type { Theme } from "@/modules/theming";
import {
  invitationPreviewDescription,
  invitationPreviewCopy,
  type PreviewEventDetails,
} from "../lib/share-metadata";

export async function renderInvitationPreview(theme: Theme, event: PreviewEventDetails) {
  const copy = invitationPreviewCopy(event);
  const [photo, display, body] = await Promise.all([
    readFile(join(process.cwd(), "public/share/couple-placeholder.jpg")),
    readFile(join(process.cwd(), `public/share/fonts/${theme.fonts.display}.ttf`)),
    readFile(join(process.cwd(), `public/share/fonts/${theme.fonts.body}.ttf`)),
  ]);
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: theme.colors.background,
        color: theme.colors.foreground,
      }}
    >
      {/* ImageResponse renders embedded bytes rather than browser HTML. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`data:image/jpeg;base64,${photo.toString("base64")}`}
        alt="A wedding couple holding hands in warm evening light"
        width={510}
        height={630}
        style={{ objectFit: "cover", objectPosition: "center" }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "48px 54px",
          width: 690,
        }}
      >
        <div
          style={{
            fontFamily: theme.fonts.body,
            fontSize: 20,
            letterSpacing: 3,
            color: theme.colors.primary,
          }}
        >
          TOGETHER WITH OUR FAMILIES
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontFamily: theme.fonts.display,
            fontSize: 76,
            lineHeight: 1.05,
            marginTop: 28,
          }}
        >
          <span>{event.coupleNames[0]}</span>
          <span style={{ fontSize: 42, color: theme.colors.primary, margin: "6px 0" }}>&amp;</span>
          <span>{event.coupleNames[1]}</span>
        </div>
        <div style={{ fontFamily: theme.fonts.body, fontSize: 23, marginTop: 32 }}>{copy.date}</div>
        <div style={{ fontFamily: theme.fonts.display, fontSize: 29, marginTop: 28 }}>
          {invitationPreviewDescription}
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: theme.fonts.display, data: display, weight: 400, style: "normal" },
        { name: theme.fonts.body, data: body, weight: 400, style: "normal" },
      ],
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=60",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}
