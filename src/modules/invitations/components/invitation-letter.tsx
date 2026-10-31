import { InstallPrompt } from "@/modules/shared/components/install-prompt";
import type { ReactNode } from "react";
import { z } from "zod";
import { Divider } from "@/modules/shared/components/ui/decorations";
import type { EventSettings } from "@/modules/shared/lib/event-settings";
import { invitationSiteCopy } from "../lib/copy";
import { Envelope } from "./envelope";

export type InvitationEventDetails = Readonly<
  Pick<EventSettings, "eventDate" | "ceremonyTime" | "timeZone" | "venue" | "mapUrl" | "dressCode">
> & { readonly coupleNames: readonly [string, string] };

const safeMap = z.url({ protocol: /^https$/ });
const linkStyle =
  "inline-flex min-h-11 min-w-11 items-center py-2 text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring";

/** A date-only event never shifts to yesterday in a visitor's time zone. */
function eventDateLabel(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value + "T12:00:00Z"));
}

function ceremonyLabel(value: string | null, timeZone: string | null) {
  if (!value) return "Time to follow";
  const hour = Number(value.slice(0, 2));
  const time = `${hour % 12 || 12}:${value.slice(3, 5)} ${hour < 12 ? "am" : "pm"}`;
  return timeZone ? `${time} · ${timeZone}` : `${time} · time zone to follow`;
}

/** Pass navigation is rendered only alongside actual pass content supplied by its owner. */
export function InvitationLetter({
  details,
  greeting,
  children,
  pass,
}: {
  details: InvitationEventDetails;
  greeting: string;
  children: ReactNode;
  pass?: ReactNode;
}) {
  const map = safeMap.safeParse(details.mapUrl);
  return (
    <main className="mx-auto w-full max-w-5xl px-6 pt-12 pb-[max(3rem,env(safe-area-inset-bottom))] md:px-12 md:pt-20">
      <header className="mx-auto max-w-3xl text-center">
        <Envelope
          initials={[
            Array.from(details.coupleNames[0])[0] ?? "",
            Array.from(details.coupleNames[1])[0] ?? "",
          ]}
          returning={Boolean(pass)}
        />
        <p className="mx-auto w-[17rem] max-w-full text-left type-label text-primary">
          Together with our families
        </p>
        <h1 className="mt-8 type-script wrap-anywhere">
          <span className="block">{details.coupleNames[0]}</span>
          <span className="my-2 block text-primary">{" & "}</span>
          <span className="block">{details.coupleNames[1]}</span>
        </h1>
        <p className="mt-10 type-heading">
          {invitationSiteCopy.headline.split(/(?<=\.) /).map((line, index) => (
            <span key={line} className="block">
              {index > 0 ? " " : ""}
              {line}
            </span>
          ))}
        </p>
        <p className="mx-auto mt-6 max-w-prose text-left text-lg leading-relaxed wrap-anywhere">
          {greeting}
        </p>
        <p className="mx-auto mt-6 max-w-prose text-left text-lg leading-relaxed">
          {invitationSiteCopy.subline}
        </p>
        <nav
          aria-label="Your invitation"
          className="mt-6 flex flex-wrap justify-center gap-x-8 gap-y-2"
        >
          {pass && (
            <a href="#pass" className={linkStyle}>
              Your pass
            </a>
          )}
          <a href="#reply" className={linkStyle}>
            Kindly reply
          </a>
        </nav>
      </header>
      {pass && (
        <section
          id="pass"
          aria-label="Your entry pass"
          tabIndex={-1}
          className="mt-12 scroll-mt-6 focus-visible:outline-2 focus-visible:outline-ring"
        >
          {pass}
          <InstallPrompt />
        </section>
      )}
      <Divider className="my-12 md:my-16" />
      <section aria-labelledby="celebration-details">
        <h2 id="celebration-details" className="text-center type-heading">
          The celebration
        </h2>
        <dl className="mt-8 grid gap-8 text-center text-base leading-relaxed md:grid-cols-3 md:gap-12">
          <div className="min-w-0">
            <dt className="type-label text-primary">The day</dt>
            <dd className="mt-4">
              <time dateTime={details.eventDate}>{eventDateLabel(details.eventDate)}</time>
              <p className="mt-2">{ceremonyLabel(details.ceremonyTime, details.timeZone)}</p>
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="type-label text-primary">The place</dt>
            <dd className="mt-4 wrap-anywhere">
              {details.venue ?? "Venue to follow"}
              {details.venue && map.success && (
                <div className="mt-2">
                  <a
                    className={linkStyle}
                    href={map.data}
                    rel="noreferrer"
                    referrerPolicy="no-referrer"
                  >
                    View the venue
                  </a>
                </div>
              )}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="type-label text-primary">Dress code</dt>
            <dd className="mt-4 wrap-anywhere">{details.dressCode ?? "Dress code to follow"}</dd>
          </div>
        </dl>
      </section>
      <div
        id="reply"
        tabIndex={-1}
        className="mx-auto mt-12 max-w-2xl scroll-mt-6 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >
        {children}
      </div>
    </main>
  );
}
