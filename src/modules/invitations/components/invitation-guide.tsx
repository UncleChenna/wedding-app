import Link from "next/link";
import { appRoutes } from "@/modules/shared/lib/routes";
import { eventSummary, type PublicEventDetails } from "../lib/event-summary";

export function InvitationGuide({ settings }: { settings: PublicEventDetails }) {
  const summary = eventSummary(settings);
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center px-6 py-16">
      <p className="mb-8 text-base tracking-widest text-primary uppercase">{summary.title}</p>
      <h1 className="font-display text-5xl tracking-tight md:text-6xl">
        An invitation <span className="block">just for you</span>
      </h1>
      <p className="mt-8 text-lg leading-relaxed">
        Your personal invitation will arrive as a link from us. Keep it close — it will be your way
        to reply and find the details for our celebration.
      </p>
      <p className="mt-6 text-base leading-relaxed">Save the date: {summary.date}.</p>
      <section className="mt-12" aria-labelledby="find-invitation">
        <h2 id="find-invitation" className="type-heading">
          Need your link?
        </h2>
        <p className="mt-6 text-lg leading-relaxed">
          Can’t find your invitation? Ask the person who invited you to send your link again.
        </p>
        <p className="mt-6 text-base leading-relaxed">
          Online link requests aren’t available yet. Please contact{" "}
          {settings.coupleNames.join(" or ")} directly.
        </p>
      </section>
      <Link
        prefetch={false}
        href={appRoutes.home.path}
        className="mt-10 inline-flex min-h-11 items-center justify-start text-primary underline underline-offset-4"
      >
        Back to our day
      </Link>
    </main>
  );
}
