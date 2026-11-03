import { PartyForm } from "./party-form";
import type { PartyDetails } from "../lib/party";
import type { ReactNode } from "react";
import { appRoutes } from "@/modules/shared/lib/routes";
import Link from "next/link";
import { invitationNextStep } from "../lib/invitation-next-step";
import { RsvpForm } from "./rsvp-form";
import { InvitationLetter, type InvitationEventDetails } from "./invitation-letter";
import type { GuestInvitation } from "../server/resolve-invitation";

export function PersonalInvitation({
  invitation,
  token,
  repliesOpen,
  details,
  now = new Date(),
  pass,
  passNotice,
  party,
}: {
  invitation: GuestInvitation;
  token: string;
  repliesOpen: boolean;
  details: InvitationEventDetails;
  now?: Date;
  pass?: ReactNode;
  passNotice?: ReactNode;
  party?: PartyDetails;
}) {
  const next = invitationNextStep(invitation.attendance, details.eventDate, details.timeZone, now);
  const greeting =
    invitation.primaryNames.join(" & ") || invitation.householdName || "Our dear guest";
  return (
    <InvitationLetter
      details={details}
      greeting={greeting}
      pass={invitation.attendance === "yes" ? pass : undefined}
    >
      {next.step === "closing" && (
        <section className="mb-12" aria-labelledby="reply-closing">
          <h2 id="reply-closing" className="type-heading">
            We’ll miss you
          </h2>
          <p className="mt-6 text-lg leading-relaxed">
            Thank you for letting us know. You’ll be with us in spirit.
          </p>
        </section>
      )}
      {invitation.attendance === "yes" && passNotice}
      <RsvpForm token={token} attendance={invitation.attendance} open={repliesOpen} />
      {invitation.attendance === "yes" && repliesOpen && party && (
        <PartyForm token={token} details={party} />
      )}
      {next.showOrdering && (
        <p className="mt-12">
          <Link
            href={appRoutes.order.path}
            prefetch={false}
            className="inline-flex min-h-11 min-w-11 items-center text-lg text-primary underline underline-offset-4"
          >
            Order to your table
          </Link>
        </p>
      )}
      <Link
        href={appRoutes.home.path}
        prefetch={false}
        className="mt-10 inline-flex min-h-11 min-w-11 items-center text-primary underline underline-offset-4"
      >
        Back to our day
      </Link>
    </InvitationLetter>
  );
}
