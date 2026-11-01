import { eventSummary } from "@/modules/invitations/lib/event-summary";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getEventSettings } from "@/modules/shared/server/settings";
import { db } from "@/modules/shared/server/db/client";
import { findGuestInvitation } from "@/modules/invitations/server/repository";
import { PersonalInvitation } from "@/modules/invitations/components/personal-invitation";

// Personal replies must render as usable HTML even when JavaScript is disabled.
// This private route intentionally waits for authorization and data rather than streaming a JS-revealed shell.
export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  await connection();
  const { description } = eventSummary(await getEventSettings());
  return {
    title: "Your invitation",
    description,
    robots: { index: false, follow: false },
    openGraph: { title: "Your invitation", description },
  };
}

async function Invitation({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invitation = await findGuestInvitation(db, token);
  if (!invitation) notFound();
  const settings = await getEventSettings();
  return (
    <PersonalInvitation
      invitation={invitation}
      details={settings}
      token={token}
      repliesOpen={settings.timeZone !== null}
    />
  );
}

export default async function PersonalInvitationPage(props: {
  params: Promise<{ token: string }>;
}) {
  await connection();
  return <Invitation {...props} />;
}
