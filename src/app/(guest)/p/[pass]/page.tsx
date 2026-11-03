import { invitationPreviewMetadata } from "@/modules/invitations/lib/share-metadata";
import type { Metadata } from "next";
import { connection } from "next/server";

import { GatePass } from "@/modules/checkin/components/gate-pass";
import { gatePassUrl } from "@/modules/checkin/lib/pass-url";
import { resolveGatePassFrom } from "@/modules/checkin/server/resolve-pass";
import { clientEnv } from "@/modules/shared/lib/env/client";
import { db } from "@/modules/shared/server/db/client";

// Pass state is current server data; render per request and wait for it rather than streaming.
export const instant = false;

// Generic and identical for every pass: previews must never reveal guest names (ADR 0020).
const preview = invitationPreviewMetadata(clientEnv.NEXT_PUBLIC_SITE_URL);
export const metadata: Metadata = {
  ...preview,
  title: "Your gate pass",
  description: "Your pass for the celebration.",
  robots: { index: false, follow: false },
  openGraph: {
    ...preview.openGraph,
    title: "Your gate pass",
    description: "Your pass for the celebration.",
  },
  twitter: {
    ...preview.twitter,
    title: "Your gate pass",
    description: "Your pass for the celebration.",
  },
};

async function Pass({ params }: { params: Promise<{ pass: string }> }) {
  const { pass } = await params;
  const resolution = await resolveGatePassFrom(db, pass);
  return (
    <GatePass resolution={resolution} passUrl={gatePassUrl(clientEnv.NEXT_PUBLIC_SITE_URL, pass)} />
  );
}

export default async function GatePassPage(props: { params: Promise<{ pass: string }> }) {
  await connection();
  return <Pass {...props} />;
}
