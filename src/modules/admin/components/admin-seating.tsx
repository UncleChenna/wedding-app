import Link from "next/link";
import { RetryButton } from "@/modules/shared/components/retry-button";
import { getSeatingPlan } from "../server/seating-reader";
import { SeatingEditor } from "./seating-editor";

export async function AdminSeating() {
  const result = await getSeatingPlan();
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12 text-lg leading-relaxed">
      <Link
        href="/admin/guests"
        className="inline-flex min-h-11 items-center text-primary underline underline-offset-4"
      >
        Back to guests
      </Link>
      <h1 className="mt-6 font-display text-4xl leading-tight md:text-5xl">Seating plan</h1>
      <p className="mt-6 max-w-prose">
        Make room for everyone. Keep each household together and adjust tables as replies arrive.
      </p>
      <Link
        href="/admin/guests/seating/cards"
        className="mt-4 inline-flex min-h-11 items-center text-primary underline underline-offset-4"
      >
        Print table cards
      </Link>
      {result.ok ? (
        <SeatingEditor plan={result.plan} />
      ) : (
        <div className="mt-12 space-y-6">
          <p role="alert">{result.message}</p>
          <RetryButton />
        </div>
      )}
    </main>
  );
}
