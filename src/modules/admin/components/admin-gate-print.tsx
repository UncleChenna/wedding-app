import Link from "next/link";
import { RetryButton } from "@/modules/shared/components/retry-button";
import { getGatePrintList } from "../server/gate-print";
import { GatePrintTable } from "./gate-print-table";
import { PrintGateButton } from "./print-gate-button";
import "./gate-print.css";
export async function AdminGatePrint() {
  const result = await getGatePrintList();
  return (
    <main
      className={`gate-print-page mx-auto max-w-5xl px-4 py-10 text-base leading-relaxed md:px-8`}
    >
      <h1 className="font-display text-4xl">Gate guest list</h1>
      <div className={`gate-print-controls mt-6 flex flex-wrap items-center gap-6`}>
        {result.ok && result.rows.length > 0 ? <PrintGateButton /> : null}
        <Link
          href="/admin/guests"
          className="inline-flex min-h-11 items-center text-primary underline"
        >
          Back to guests
        </Link>
      </div>
      {!result.ok ? (
        <div className="mt-8 space-y-4">
          <p role="alert">{result.message}</p>
          <RetryButton />
        </div>
      ) : (
        <>
          <p className="mt-6">
            Exported {result.exportedAt.replace("T", " ").replace(/\.\d+Z$/, " UTC")}.{" "}
            {result.rows.length} confirmed invitations.
          </p>
          <p className="mt-3">
            Keep this list with the gate team. Filled boxes are admissions already recorded; tick an
            empty box for each new arrival. Use one working copy and reconcile it before returning
            to scanners.
          </p>
          <p className="mt-3">
            Sorted by the last word of the primary guest’s name. All named companions are listed
            with their household. This paper copy will not receive later changes.
          </p>
          <div className="mt-8">
            {result.rows.length ? (
              <GatePrintTable rows={result.rows} />
            ) : (
              <p>No confirmed invitations to print yet.</p>
            )}
          </div>
        </>
      )}
    </main>
  );
}
