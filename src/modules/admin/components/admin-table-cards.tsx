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
        <h1 className="mt-6 font-display text-4xl leading-tight md:text-5xl">
          Printable table signs
        </h1>
        <p className="mt-6 max-w-prose">
          Print these signs and place one on each reception table. Guests scan the QR code to open
          the food and drinks menu, then select the table number printed on the sign.
        </p>
        <ol className="mt-6 max-w-prose list-decimal space-y-3 pl-6">
          <li>Create your tables and assign guests in the seating plan.</li>
          <li>
            Review the signs below, then choose Print or save PDF. Use A6 paper, portrait, at 100%
            scale.
          </li>
          <li>
            Put each sign on its matching table. Test a QR code on your phone before printing all
            copies.
          </li>
        </ol>
        <p className="mt-6 max-w-prose text-muted-foreground">
          These are table signs, not guest invitations or individual place cards. Every sign uses
          the same ordering QR; guests choose their table after scanning. Opening this page sends
          nothing.
        </p>
      </div>
      {!result.ok ? (
        <div className="mt-12 space-y-6">
          <p role="alert">{result.message}</p>
          <RetryButton />
        </div>
      ) : result.cards.length === 0 ? (
        <p className="mt-12 max-w-prose">
          There are no table signs to print yet.{" "}
          <Link href="/admin/guests/seating" className="text-primary underline">
            Add them in the seating plan
          </Link>{" "}
          and a sign for each table will appear here.
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
          <div className="table-cards-controls mt-10">
            <h2 className="font-display text-2xl">
              Print preview · {result.cards.length} table{" "}
              {result.cards.length === 1 ? "sign" : "signs"}
            </h2>
            <p className="mt-3">
              One sign per A6 page. Only the signs below appear in the printout.
            </p>
            <Link
              href="/order"
              className="mt-4 inline-flex min-h-11 items-center text-primary underline underline-offset-4"
            >
              Preview the guest ordering page
            </Link>
          </div>
          <div className="mt-8">
            <TableCardList cards={result.cards} orderUrl={result.orderUrl} wifi={result.wifi} />
          </div>
        </>
      )}
    </main>
  );
}
