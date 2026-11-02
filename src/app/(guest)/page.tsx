import { clientEnv } from "@/modules/shared/lib/env/client";
import { invitationPreviewMetadata } from "@/modules/invitations/lib/share-metadata";
import type { Metadata } from "next";
import { connection } from "next/server";
import { getPublicEventDetails } from "@/modules/invitations/server/public-event-details";
import { WeddingHome } from "@/modules/invitations/components/wedding-home";
import { eventSummary } from "@/modules/invitations/lib/event-summary";

export const instant = false;
export async function generateMetadata(): Promise<Metadata> {
  await connection();
  const settings = await getPublicEventDetails();
  const { title, description } = eventSummary(settings);
  const preview = invitationPreviewMetadata(clientEnv.NEXT_PUBLIC_SITE_URL, settings);
  return {
    ...preview,
    title,
    description,
  };
}
export default async function HomePage() {
  await connection();
  return <WeddingHome settings={await getPublicEventDetails()} />;
}
