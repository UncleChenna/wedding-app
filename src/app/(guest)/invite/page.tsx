import { clientEnv } from "@/modules/shared/lib/env/client";
import { invitationPreviewMetadata } from "@/modules/invitations/lib/share-metadata";
import { InvitationGuide } from "@/modules/invitations/components/invitation-guide";
import type { Metadata } from "next";
import { connection } from "next/server";
import { getEventSettings } from "@/modules/shared/server/settings";
import { eventSummary } from "@/modules/invitations/lib/event-summary";

export const instant = false;
export async function generateMetadata(): Promise<Metadata> {
  await connection();
  const { description } = eventSummary(await getEventSettings());
  const preview = invitationPreviewMetadata(clientEnv.NEXT_PUBLIC_SITE_URL);
  return {
    ...preview,
    title: "Your invitation",
    description,
    openGraph: { ...preview.openGraph, title: "Your invitation", description },
  };
}
export default async function InvitationGuidePage() {
  await connection();
  return <InvitationGuide settings={await getEventSettings()} />;
}
