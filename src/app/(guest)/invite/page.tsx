import { clientEnv } from "@/modules/shared/lib/env/client";
import { invitationPreviewMetadata } from "@/modules/invitations/lib/share-metadata";
import { InvitationGuide } from "@/modules/invitations/components/invitation-guide";
import type { Metadata } from "next";
import { connection } from "next/server";
import { getPublicEventDetails } from "@/modules/invitations/server/public-event-details";
import { eventSummary } from "@/modules/invitations/lib/event-summary";

export const instant = false;
export async function generateMetadata(): Promise<Metadata> {
  await connection();
  const settings = await getPublicEventDetails();
  const { description } = eventSummary(settings);
  const preview = invitationPreviewMetadata(clientEnv.NEXT_PUBLIC_SITE_URL, settings);
  return {
    ...preview,
    title: "Your invitation",
    description,
  };
}
export default async function InvitationGuidePage() {
  await connection();
  return <InvitationGuide settings={await getPublicEventDetails()} />;
}
