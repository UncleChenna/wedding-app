import { randomUUID } from "node:crypto";
import Link from "next/link";
import { RetryButton } from "@/modules/shared/components/retry-button";
import { requireAdminPageAccess } from "../server/current-admin-access";
import { readScanLog } from "../server/scan-log-service";
import { scanLogPorts } from "../server/scan-log";
import { ScanLogView } from "./scan-log-view";
import { ScanNoteForm } from "./scan-note-form";

export async function AdminScanLog({
  query,
}: {
  query: Record<string, string | string[] | undefined>;
}) {
  await requireAdminPageAccess();
  const result = await readScanLog(query, scanLogPorts);
  if (result.status !== "ready")
    return (
      <main className="mx-auto max-w-5xl space-y-6 px-6 py-12 text-lg leading-relaxed">
        <h1 className="font-display text-4xl md:text-5xl">Scan log</h1>
        <p role="alert">
          {result.status === "denied"
            ? "Please sign in again to view the scan log."
            : result.message}
        </p>
        <Link
          href={result.status === "denied" ? "/admin/sign-in" : "/admin/scans"}
          className="inline-flex min-h-11 items-center text-primary underline"
        >
          {result.status === "denied" ? "Sign in" : "Clear filters"}
        </Link>
        {result.status === "error" && <RetryButton />}
      </main>
    );
  return (
    <ScanLogView
      {...result}
      renderNote={(entry) => <ScanNoteForm eventId={entry.id} requestId={randomUUID()} />}
    />
  );
}
