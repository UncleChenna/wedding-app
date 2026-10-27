import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { db } from "@/modules/shared/server/db/client";
import { findGuestInvitation } from "@/modules/invitations/server/repository";
import { PersonalInvitation } from "@/modules/invitations/components/personal-invitation";

export const metadata: Metadata = {
  title: "Your invitation",
  description: "Celebrate with Uchenna and Adaora.",
  robots: { index: false, follow: false },
  openGraph: { title: "Your invitation", description: "Celebrate with Uchenna and Adaora." },
};

async function Invitation({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invitation = await findGuestInvitation(db, token);
  if (!invitation) notFound();
  return <PersonalInvitation invitation={invitation} />;
}

export default function PersonalInvitationPage(props: { params: Promise<{ token: string }> }) {
  return (
    <Suspense
      fallback={<main className="p-6 text-lg leading-relaxed">Preparing your invitation…</main>}
    >
      <Invitation {...props} />
    </Suspense>
  );
}
