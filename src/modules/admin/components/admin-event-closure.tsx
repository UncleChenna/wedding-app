import Link from "next/link";
import { getEventSettings } from "@/modules/shared/server/settings";
import { staffEventExpiry } from "@/modules/shared/lib/staff-expiry";
import { requireAdminPageAccess } from "../server/current-admin-access";
import { EventClosureForm } from "./event-closure-form";

export async function AdminEventClosure() {
  await requireAdminPageAccess();
  const settings = await getEventSettings();
  const cutoff = staffEventExpiry(settings.eventDate, settings.timeZone);
  const eligible = cutoff !== null && new Date() >= cutoff;
  const cutoffLabel =
    cutoff && settings.timeZone
      ? new Intl.DateTimeFormat("en-GB", {
          dateStyle: "long",
          timeStyle: "short",
          timeZone: settings.timeZone,
        }).format(cutoff)
      : null;
  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12 text-lg leading-relaxed">
      <h1 className="font-display text-4xl leading-tight md:text-5xl">After the celebration</h1>
      <p className="mt-6 max-w-prose">
        Keep a little memory of the day, then bring staff access and ordering to a close.
      </p>
      <section aria-labelledby="memories-heading" className="mt-12">
        <h2 id="memories-heading" className="font-display text-3xl">
          Your memories
        </h2>
        <p className="mt-3 max-w-prose">
          Save invitation and attendance counts, plus the menu favourites. These downloads contain
          no guest names, contact details or dietary notes.
        </p>
        <div className="mt-6 flex flex-wrap gap-4">
          <Link
            download
            prefetch={false}
            className="inline-flex min-h-11 items-center rounded-md bg-primary px-5 py-3 text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            href="/admin/memories/pdf"
          >
            Download PDF
          </Link>
          <Link
            download
            prefetch={false}
            className="inline-flex min-h-11 items-center rounded-md bg-secondary px-5 py-3 text-secondary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            href="/admin/memories/csv"
          >
            Download CSV
          </Link>
        </div>
      </section>
      <section aria-labelledby="closure-heading" className="mt-12 border-t border-border pt-12">
        <h2 id="closure-heading" className="font-display text-3xl">
          Close the event
        </h2>
        <p className="mt-3 max-w-prose">
          This ends gate, kitchen and bar access and stops ordering. Admin access and admission
          records stay available. Guest data is not deleted.
        </p>
        <p className="mt-4 max-w-prose">
          {cutoffLabel
            ? `Available from ${cutoffLabel} (${settings.timeZone}). Refresh this page after that time.`
            : "Confirm the wedding date and venue time zone in Settings before closing the event."}
        </p>
        <EventClosureForm eventDate={settings.eventDate} eligible={eligible} />
      </section>
    </main>
  );
}
