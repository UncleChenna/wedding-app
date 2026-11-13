"use client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/modules/shared/components/ui/button";
import {
  recoveryExportSchema,
  recoveryResultSchema,
  RECOVERY_BODY_LIMIT,
  type RecoveryExport,
} from "@/modules/checkin/lib/recovery";
export function ScanRecovery() {
  const [evidence, setEvidence] = useState<RecoveryExport | null>(null),
    [reviewed, setReviewed] = useState(false);
  const [requestId, setRequestId] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const [receipt, setReceipt] = useState<string | null>(null),
    [outcomes, setOutcomes] = useState<{ clientEventId: string; status: string }[]>([]);
  async function choose(file: File | undefined) {
    setEvidence(null);
    setReviewed(false);
    setReceipt(null);
    setOutcomes([]);
    setMessage("");
    if (!file) return;
    if (file.size > RECOVERY_BODY_LIMIT) {
      setMessage("Choose a recovery file of at most 200 records.");
      return;
    }
    try {
      const parsed = recoveryExportSchema.parse(JSON.parse(await file.text()));
      setEvidence(parsed);
      setRequestId(crypto.randomUUID());
    } catch {
      setMessage("This file could not be read. Ask the gate operator to export it again.");
    }
  }
  async function submit() {
    if (!evidence || !reviewed || busy) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/scans/recovery", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, reviewed, evidence }),
      });
      if (!response.ok) throw new Error("Recovery unavailable");
      const result = recoveryResultSchema.parse(await response.json());
      setOutcomes(result.acks);
      setReceipt(result.receipt);
      const confirmed = result.acks.filter(
        (row) => row.status === "recorded" || row.status === "duplicate",
      ).length;
      setMessage(
        `${confirmed} of ${evidence.records.length} records confirmed. Rejected or unconfirmed records must remain on the original device.`,
      );
    } catch {
      setMessage(
        "We couldn't confirm this import. Keep the original file and retry this same review; records will not be counted twice.",
      );
    } finally {
      setBusy(false);
    }
  }
  function download() {
    if (!receipt) return;
    const url = URL.createObjectURL(new Blob([receipt], { type: "text/plain" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "gate-recovery-receipt.txt";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-6 py-12 text-lg leading-relaxed">
      <h1 className="font-display text-4xl md:text-5xl">Recover gate records</h1>
      <p>
        Review records retained after gate sign-in expired. Confirm the original device and operator
        before importing; a recovery file does not prove that its contents are genuine.
      </p>
      <Link
        href="/gate-recovery"
        className="inline-flex min-h-11 items-center text-primary underline"
      >
        Open recovery on the original device
      </Link>
      <div className="space-y-2">
        <label htmlFor="recovery-file" className="block font-semibold">
          Gate recovery file
        </label>
        <input
          id="recovery-file"
          type="file"
          accept=".json,application/json"
          disabled={busy}
          className="min-h-11 w-full max-w-full"
          onChange={(event) => void choose(event.target.files?.[0])}
        />
      </div>
      {evidence && (
        <section className="space-y-6" aria-labelledby="review-heading">
          <h2 id="review-heading" className="font-display text-3xl">
            Review {evidence.records.length} records
          </h2>
          <ul className="space-y-6">
            {evidence.records.map(({ actor, event }) => (
              <li
                key={event.clientEventId}
                className="space-y-2 border-b border-border pb-6 break-words"
              >
                <p className="font-semibold">
                  {event.reportedPeople} people · {event.reportedResult.replaceAll("_", " ")}
                </p>
                <dl className="space-y-1">
                  <dt>Record</dt>
                  <dd className="break-all">{event.clientEventId}</dd>
                  <dt>Operator</dt>
                  <dd className="break-all">{actor.staffId}</dd>
                  <dt>Device</dt>
                  <dd className="break-all">{actor.deviceId}</dd>
                  <dt>Recorded time</dt>
                  <dd>{event.reportedAt}</dd>
                  <dt>Invitation</dt>
                  <dd className="break-all">{event.invitationId ?? "Unmatched"}</dd>
                </dl>
                {outcomes.find((row) => row.clientEventId === event.clientEventId) && (
                  <p>
                    {outcomes
                      .find((row) => row.clientEventId === event.clientEventId)
                      ?.status.replaceAll("_", " ")}
                  </p>
                )}
              </li>
            ))}
          </ul>
          <label className="flex min-h-11 items-start gap-3">
            <input
              type="checkbox"
              checked={reviewed}
              disabled={busy}
              onChange={(event) => setReviewed(event.target.checked)}
              className="mt-1 size-6 shrink-0"
            />
            <span>
              I checked the original device, operator and records and approve this import.
            </span>
          </label>
          <Button disabled={!reviewed || busy} onClick={() => void submit()}>
            {busy ? "Importing…" : "Import reviewed records"}
          </Button>
        </section>
      )}
      <p role="status" aria-live="polite">
        {message}
      </p>
      {receipt && (
        <section className="space-y-3">
          <h2 className="font-display text-3xl">Return the receipt</h2>
          <p>
            Save this receipt and load it in the original browser within 24 hours. Only matching
            confirmed records will be cleared. Re-importing the same file produces a fresh receipt
            without counting records twice.
          </p>
          <Button onClick={download}>Save confirmation receipt</Button>
        </section>
      )}
      <Link
        href="/admin/scans"
        className="inline-flex min-h-11 items-center text-primary underline"
      >
        Back to scan log
      </Link>
    </main>
  );
}
