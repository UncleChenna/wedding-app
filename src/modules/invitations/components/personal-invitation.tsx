import Link from "next/link";
import { RsvpForm } from "./rsvp-form";
import { invitationSiteCopy } from "../lib/copy";
import type { GuestInvitation } from "../server/resolve-invitation";

export function PersonalInvitation({
  invitation,
  token,
  repliesOpen,
}: {
  invitation: GuestInvitation;
  token: string;
  repliesOpen: boolean;
}) {
  const greeting =
    invitation.primaryNames.join(" & ") || invitation.householdName || "Our dear guest";
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col justify-center px-6 py-16">
      <p className="mb-8 text-base leading-relaxed wrap-anywhere text-primary">{greeting}</p>
      <h1 className="font-display text-5xl leading-tight tracking-tight md:text-6xl">
        Uchenna &amp; Adaora
      </h1>
      <p className="mt-8 text-lg leading-relaxed">{invitationSiteCopy.subline}</p>
      <p className="mt-6 text-lg leading-relaxed">Saturday, 19 December 2026</p>
      <p className="mt-6 text-base leading-relaxed">
        Venue and time to follow. Keep this personal link close.
      </p>
      <RsvpForm token={token} attendance={invitation.attendance} open={repliesOpen} />
      <Link
        href="/"
        prefetch={false}
        className="mt-10 inline-flex min-h-11 items-center self-start text-primary underline underline-offset-4"
      >
        Back to our day
      </Link>
    </main>
  );
}
