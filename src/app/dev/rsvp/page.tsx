import type { Metadata } from "next";
import { RsvpPreview } from "@/modules/invitations/components/rsvp-preview";
import { listThemes } from "@/modules/theming";

export const metadata: Metadata = { title: "RSVP preview", robots: { index: false } };
export default function RsvpPreviewPage() {
  return <RsvpPreview themes={listThemes()} />;
}
