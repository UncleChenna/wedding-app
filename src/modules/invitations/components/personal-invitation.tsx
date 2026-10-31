import Link from "next/link";
import { RsvpForm } from "./rsvp-form";
import { InvitationLetter, type InvitationEventDetails } from "./invitation-letter";
import type { GuestInvitation } from "../server/resolve-invitation";

export function PersonalInvitation({
  invitation,
  token,
  repliesOpen,
  details,
}: {
  invitation: GuestInvitation;
  token: string;
  repliesOpen: boolean;
  details: InvitationEventDetails;
}) {
  const greeting =
    invitation.primaryNames.join(" & ") || invitation.householdName || "Our dear guest";
  return (
    <InvitationLetter details={details} greeting={greeting}>
      <RsvpForm token={token} attendance={invitation.attendance} open={repliesOpen} />
      <Link
        href="/"
        prefetch={false}
        className="mt-10 inline-flex min-h-11 min-w-11 items-center text-primary underline underline-offset-4"
      >
        Back to our day
      </Link>
    </InvitationLetter>
  );
}
