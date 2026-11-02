import { cacheLife } from "next/cache";
import { getPublicEventDetails } from "@/modules/invitations/server/public-event-details";
import { clientEnv } from "@/modules/shared/lib/env/client";
import { invitationPreviewMetadata } from "@/modules/invitations/lib/share-metadata";
import { eventSummary } from "@/modules/invitations/lib/event-summary";
import { findInvitationPassIdentity } from "@/modules/invitations/server/pass-identity";
import { issueGatePassFrom } from "@/modules/checkin/server/issue-pass";
import { QrPass, PassUnavailable } from "@/modules/invitations/components/qr-pass";
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
  "use cache";
  cacheLife({ stale: 300, revalidate: 30, expire: 300 });
  const settings = await getPublicEventDetails();
  const { description } = eventSummary(settings);
  const preview = invitationPreviewMetadata(clientEnv.NEXT_PUBLIC_SITE_URL, settings);
  return {
    ...preview,
    title: "Your invitation",
    description,
    robots: { index: false, follow: false },
  };
}

async function Invitation({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invitation = await findGuestInvitation(db, token);
  if (!invitation) notFound();
  const identity =
    invitation.attendance === "yes" ? await findInvitationPassIdentity(db, token) : null;
  const issued = identity
    ? await issueGatePassFrom(db, identity, clientEnv.NEXT_PUBLIC_SITE_URL)
    : null;
  const settings = await getEventSettings();
  return (
    <PersonalInvitation
      invitation={invitation}
      details={settings}
      token={token}
      repliesOpen={settings.timeZone !== null}
      pass={issued?.state === "ready" ? <QrPass url={issued.url} pass={issued.pass} /> : undefined}
      passNotice={issued?.state === "unavailable" ? <PassUnavailable /> : undefined}
    />
  );
}

export default async function PersonalInvitationPage(props: {
  params: Promise<{ token: string }>;
}) {
  await connection();
  return <Invitation {...props} />;
}
