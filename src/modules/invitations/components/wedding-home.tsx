import Link from "next/link";
import { appRoutes } from "@/modules/shared/lib/routes";
import { ceremonyLabel, eventSummary, type PublicEventDetails } from "../lib/event-summary";
import { invitationSiteCopy } from "../lib/copy";
export function WeddingHome({ settings }: { settings: PublicEventDetails }) {
  const summary = eventSummary(settings);
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col items-center justify-center px-6 py-16 text-center">
      <p className="mb-12 text-base tracking-widest text-primary uppercase">The celebration</p>
      <h1 className="font-display text-6xl leading-tight tracking-tight wrap-anywhere md:text-8xl">
        {settings.coupleNames[0]} <span className="block text-primary">&amp;</span>{" "}
        {settings.coupleNames[1]}
      </h1>
      <p className="mt-10 font-display text-3xl md:text-4xl">{invitationSiteCopy.headline}</p>
      <time dateTime={settings.eventDate} className="mt-8 text-lg leading-relaxed">
        {summary.date}
      </time>
      <p className="mt-4 text-lg leading-relaxed">{settings.venue ?? "Venue to follow"}</p>
      <p className="mt-2 text-lg leading-relaxed">
        {ceremonyLabel(settings.ceremonyTime, settings.timeZone)}
      </p>
      <p className="mt-8 max-w-prose text-base leading-relaxed">
        We can&apos;t wait to celebrate with you.
      </p>
      <Link
        prefetch={false}
        href={appRoutes.invite.path}
        className="mt-10 inline-flex min-h-11 items-center text-lg text-primary underline underline-offset-4"
      >
        Your invitation
      </Link>
      {process.env.NODE_ENV === "development" && (
        <Link
          prefetch={false}
          href={appRoutes.dev.path}
          className="mt-8 inline-flex min-h-11 items-center text-primary underline underline-offset-4"
        >
          Browse page previews
        </Link>
      )}
    </main>
  );
}
