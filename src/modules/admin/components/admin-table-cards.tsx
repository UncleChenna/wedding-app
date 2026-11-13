import Link from "next/link";
import { RetryButton } from "@/modules/shared/components/retry-button";
import { getTableCards } from "../server/table-cards";
import { PrintGateButton } from "./print-gate-button";
import { TableCardList } from "./table-card-list";
import "./table-cards.css";

export async function AdminTableCards() {
  const result = await getTableCards();
  return (
    <main className="table-cards-page mx-auto w-full max-w-6xl px-6 py-12 text-lg leading-relaxed">
      <div className="table-cards-controls">
        <Link
          href="/admin/guests/seating"
          className="inline-flex min-h-11 items-center text-primary underline underline-offset-4"
        >
          Back to seating
        </Link>
        <h1 className="mt-6 font-display text-4xl leading-tight md:text-5xl">Table cards</h1>
        <p className="mt-6 max-w-prose">
          One card for every table, each with the order QR and the venue Wi-Fi. Each card prints on
          its own A6 page.
        </p>
      </div>
      {!result.ok ? (
        <div className="mt-12 space-y-6">
          <p role="alert">{result.message}</p>
          <RetryButton />
        </div>
      ) : result.cards.length === 0 ? (
        <p className="mt-12 max-w-prose">
          No tables yet.{" "}
          <Link href="/admin/guests/seating" className="text-primary underline">
            Add them in the seating plan
          </Link>{" "}
          and their cards will appear here.
        </p>
      ) : (
        <>
          <div className="table-cards-controls mt-8 flex flex-wrap items-center gap-6">
            <PrintGateButton />
            {result.wifi ? null : (
              <p className="max-w-prose">
                The Wi-Fi isn’t set yet.{" "}
                <Link href="/admin/settings" className="text-primary underline">
                  Add it in settings
                </Link>{" "}
                to print it on every card.
              </p>
            )}
          </div>
          <div className="mt-12">
            <TableCardList cards={result.cards} orderUrl={result.orderUrl} wifi={result.wifi} />
          </div>
        </>
      )}
    </main>
  );
}
