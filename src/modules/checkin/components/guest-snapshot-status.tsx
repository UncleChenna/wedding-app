"use client";

import { Button } from "@/modules/shared/components/ui/button";

export type GuestSnapshotSummary = { generatedAt: number; expiresAt: number };

export function GuestSnapshotStatus({
  summary,
  now,
  refreshing,
  failed,
  refresh,
}: {
  summary: GuestSnapshotSummary | null;
  now: number;
  refreshing: boolean;
  failed: boolean;
  refresh: () => void;
}) {
  const active = summary !== null && summary.expiresAt > now;
  const minutes = summary ? Math.max(0, Math.floor((now - summary.generatedAt) / 60_000)) : 0;
  const stale = active && minutes >= 30;
  const message =
    refreshing && !active
      ? "Saving the latest guest list…"
      : !active
        ? "Connect to save a guest list for this scanner."
        : minutes === 0
          ? "Guest list saved just now."
          : `Guest list saved ${minutes} ${minutes === 1 ? "minute" : "minutes"} ago.`;
  return (
    <section aria-label="Saved guest list" className="flex flex-col gap-3 text-lg leading-relaxed">
      <div
        className={`flex min-h-36 flex-col gap-2 rounded-md p-4 ${stale ? "bg-warning-subtle text-warning-subtle-foreground" : "bg-surface-muted text-foreground"}`}
      >
        <p role="status">{message}</p>
        {stale ? (
          <p>This list is over 30 minutes old. Refresh when connected.</p>
        ) : (
          <p>Offline changes may be missing until the next refresh.</p>
        )}
        {failed && active && (
          <p>Couldn’t refresh. Your saved list is still available while signed in.</p>
        )}
      </div>
      <Button
        variant="secondary"
        size="lg"
        onClick={refresh}
        disabled={refreshing}
        aria-busy={refreshing || undefined}
      >
        {refreshing ? "Refreshing…" : "Refresh guest list"}
      </Button>
    </section>
  );
}
