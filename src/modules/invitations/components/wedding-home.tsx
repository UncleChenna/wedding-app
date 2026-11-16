import Link from "next/link";
import { appRoutes } from "@/modules/shared/lib/routes";
import {
  eventSummary,
  rsvpByLabel,
  timeOfDay,
  type PublicEventDetails,
} from "../lib/event-summary";
import { invitationSiteCopy } from "../lib/copy";
export function WeddingHome({ settings }: { settings: PublicEventDetails }) {
  const summary = eventSummary(settings);
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col items-stretch justify-center px-6 py-16 text-center">
      <p className="mx-auto mb-12 w-56 max-w-full text-left text-base tracking-widest text-primary uppercase">
        The celebration
      </p>
      <h1 className="font-display text-6xl leading-tight tracking-tight wrap-anywhere md:text-8xl">
        {settings.coupleNames[0]} <span className="block text-primary">&amp;</span>{" "}
        {settings.coupleNames[1]}
      </h1>
      <p className="mt-10 font-display text-3xl md:text-4xl">{invitationSiteCopy.headline}</p>
      <time dateTime={settings.eventDate} className="mt-8 text-lg leading-relaxed">
        {summary.date}
      </time>
      <dl className="mx-auto mt-8 grid w-full max-w-3xl gap-8 text-lg leading-relaxed md:grid-cols-2">
        <div className="min-w-0">
          <dt className="type-label text-primary">
            Church service
            {timeOfDay(settings.ceremonyTime) ? ` · ${timeOfDay(settings.ceremonyTime)}` : ""}
          </dt>
          <dd className="mt-2 wrap-anywhere">{settings.venue ?? "Venue to follow"}</dd>
        </div>
        <div className="min-w-0">
          <dt className="type-label text-primary">
            Reception
            {timeOfDay(settings.receptionTime) ? ` · ${timeOfDay(settings.receptionTime)}` : ""}
          </dt>
          <dd className="mt-2 wrap-anywhere">{settings.receptionVenue ?? "Venue to follow"}</dd>
        </div>
      </dl>
      <p className="mt-8 w-full text-base leading-relaxed">
        We can&apos;t wait to celebrate with you.
      </p>
      {settings.rsvpPhone ? (
        <p className="mx-auto mt-6 max-w-prose text-base leading-relaxed">
          Have a printed card? RSVP by call or text to{" "}
          <a
            href={`tel:${settings.rsvpPhone.replace(/[^+0-9]/g, "")}`}
            className="inline-flex min-h-11 items-center text-primary underline underline-offset-4"
          >
            {settings.rsvpPhone}
          </a>
          {rsvpByLabel(settings.rsvpLockAt, settings.timeZone)
            ? ` by ${rsvpByLabel(settings.rsvpLockAt, settings.timeZone)}`
            : ""}
          , with the card number from the top of your invitation.
        </p>
      ) : null}
      <Link
        prefetch={false}
        href={appRoutes.invite.path}
        className="mt-10 inline-flex min-h-11 items-center justify-center text-lg text-primary underline underline-offset-4"
      >
        Your invitation
      </Link>
    </main>
  );
}
