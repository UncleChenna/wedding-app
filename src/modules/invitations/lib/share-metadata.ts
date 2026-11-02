import type { Metadata } from "next";
import { invitationSiteCopy } from "./copy";

export const invitationPreviewTitle = "Uchenna & Adaora · 19 December 2026";
export const invitationPreviewDescription = invitationSiteCopy.headline;
export const invitationPreviewAlt =
  "Uchenna and Adaora's wedding invitation, with an illustrative wedding-couple photograph.";

/** Public event details only. Never accept an invitation, guest, token or request URL. */
export function invitationPreviewMetadata(siteUrl: string): Metadata {
  const image = new URL("/invitation-preview", new URL(siteUrl).origin).href;
  return {
    metadataBase: new URL(new URL(siteUrl).origin),
    openGraph: {
      type: "website",
      title: invitationPreviewTitle,
      description: invitationPreviewDescription,
      images: [
        { url: image, width: 1200, height: 630, type: "image/png", alt: invitationPreviewAlt },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: invitationPreviewTitle,
      description: invitationPreviewDescription,
      images: [image],
    },
  };
}
