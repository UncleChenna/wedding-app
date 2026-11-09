import Link from "next/link";
import { notFound } from "next/navigation";
import { RetryButton } from "@/modules/shared/components/retry-button";
import { getRsvpHistory } from "../server/rsvp-history";
import { RsvpHistoryTimeline } from "./rsvp-history-timeline";
export async function AdminRsvpHistory({ id }: { id: string }) {
  const result = await getRsvpHistory(id);
  if (result.status === "not-found") notFound();
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12 text-lg leading-relaxed wrap-anywhere">
      <Link
        href="/admin/guests"
        className="mb-8 inline-flex min-h-11 items-center text-primary underline underline-offset-4"
      >
        Back to guests
      </Link>
      <h1 className="font-display text-4xl md:text-5xl">Reply history</h1>
      {result.status === "error" ? (
        <div className="mt-8 space-y-6">
          <p role="alert">{result.message}</p>
          <RetryButton />
        </div>
      ) : (
        <>
          <p className="mt-6 font-display text-2xl">{result.name}</p>
          <p className="mt-3 max-w-prose">
            Each saved reply and admin correction appears below, newest first. Times are shown in
            UTC. This history is read-only.
          </p>
          <RsvpHistoryTimeline entries={result.entries} />
        </>
      )}
    </main>
  );
}
