"use client";
import { Card, CardContent } from "@/modules/shared/components/ui/card";
import { scanResolutionNotes } from "@/modules/admin/lib/scan-log";
import type { GateConflictsState } from "../lib/gate-conflicts";
export function GateConflicts({ value }: { value: GateConflictsState }) {
  if (value.state === "denied") return null;
  const entries = value.state === "ready" ? value.entries : [];
  return (
    <section aria-labelledby="gate-conflicts-heading" className="space-y-4 text-lg leading-relaxed">
      <h2 id="gate-conflicts-heading" className="font-display text-3xl">
        Entry conflicts
      </h2>
      <p role="status">
        {value.state === "loading"
          ? "Checking for entry conflicts…"
          : value.state === "unavailable"
            ? "Reconnect to see the latest entry conflicts. Ask the gate lead if you need help."
            : entries.length
              ? `${entries.length} recent ${entries.length === 1 ? "conflict" : "conflicts"} to review with the gate lead.`
              : "No entry conflicts reported."}
      </p>
      {value.state === "ready" && entries.length > 0 && (
        <>
          <ul className="space-y-4">
            {entries.map((row) => (
              <li key={row.id}>
                <Card>
                  <CardContent className="space-y-2">
                    <h3 className="font-display text-2xl">
                      {row.household ?? "Unmatched invitation"}
                    </h3>
                    <p className="font-semibold">
                      {row.reportedPeople} reported entering · {row.admittedPeople} added to the
                      guest count
                    </p>
                    <p>
                      {row.staff ?? "Unknown operator"} · {row.device ?? "Unlabelled device"}
                    </p>
                    <p>
                      Recorded on device:{" "}
                      <time dateTime={row.reportedAt}>
                        {new Date(row.reportedAt).toLocaleString()}
                      </time>
                    </p>
                    <p>
                      Received:{" "}
                      <time dateTime={row.receivedAt}>
                        {new Date(row.receivedAt).toLocaleString()}
                      </time>
                    </p>
                    <p>
                      {row.resolution
                        ? scanResolutionNotes[row.resolution]
                        : "Awaiting review by the gate lead."}
                    </p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
          <p>
            The gate lead can review the full history and add a resolution note in the admin Scan
            log. Original entries are kept.
          </p>
        </>
      )}
    </section>
  );
}
