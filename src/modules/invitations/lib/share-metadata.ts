import type { Metadata } from "next";
import { invitationSiteCopy } from "./copy";
import { defaultEventSettings } from "@/modules/shared/lib/event-settings";
import type { PublicEventDetails } from "./event-summary";

export type PreviewEventDetails = Pick<PublicEventDetails, "coupleNames" | "eventDate">;
export const invitationPreviewDescription = invitationSiteCopy.headline;

export function invitationPreviewCopy(event: PreviewEventDetails) {
  const date = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(event.eventDate + "T12:00:00Z"));
  return {
    title: `${event.coupleNames.join(" & ")} · ${date}`,
    date,
    alt: `${event.coupleNames.join(" and ")}'s wedding invitation, with an illustrative wedding-couple photograph.`,
  };
}

/** Public event details only. Never accept an invitation, guest, token or request URL. */
export function invitationPreviewMetadata(
  siteUrl: string,
  event: PreviewEventDetails = defaultEventSettings,
): Metadata {
  const copy = invitationPreviewCopy(event);
  const image = new URL("/invitation-preview", new URL(siteUrl).origin).href;
  return {
    metadataBase: new URL(new URL(siteUrl).origin),
    openGraph: {
      type: "website",
      title: copy.title,
      description: invitationPreviewDescription,
      images: [{ url: image, width: 1200, height: 630, type: "image/png", alt: copy.alt }],
    },
    twitter: {
      card: "summary_large_image",
      title: copy.title,
      description: invitationPreviewDescription,
      images: [image],
    },
  };
}
