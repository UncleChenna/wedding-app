import { subscribeStation, type RealtimeClientLike } from "@/modules/shared/lib/station-channel";

type Options = {
  client?: RealtimeClientLike;
  refresh: () => Promise<void>;
  /** Reuse the snapshot's known-change barrier before fetching authoritative state. */
  invalidate: () => Promise<void>;
  signedOut: () => void;
  subscribe?: typeof subscribeStation;
};

/** Notifications invalidate; their counts never become canonical local admissions. */
export function startScannerUpdates({
  client,
  refresh,
  invalidate,
  signedOut,
  subscribe = subscribeStation,
}: Options): () => void {
  let stopped = false;
  const subscription: { stop?: () => void } = {};
  const refetch = async () => {
    if (stopped) return;
    try {
      await refresh();
    } catch {
      // Existing snapshot freshness/recovery UI owns failure presentation.
    }
  };
  const changed = async () => {
    if (stopped) return;
    try {
      await invalidate();
      await refetch();
    } catch {
      // A failed invalidation must not bypass the private snapshot's safety barrier.
    }
  };
  // Independent of WebSocket/token retry state: even a stalled token request
  // cannot disable fallback. The snapshot layer coalesces overlapping fetches.
  const poll = setInterval(() => void refetch(), 5_000);
  function stop() {
    if (stopped) return;
    stopped = true;
    clearInterval(poll);
    subscription.stop?.();
  }
  if (client)
    subscription.stop = subscribe({
      station: "gate",
      client,
      onEvent: (event) => {
        if (event === "checkin.recorded") void changed();
      },
      onResync: () => void refetch(),
      onStatus: (status) => {
        if (!stopped && status === "signed-out") {
          stop();
          signedOut();
        }
      },
    });
  if (stopped) subscription.stop?.();
  return stop;
}
