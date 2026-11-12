"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/modules/shared/components/ui/button";
import {
  readOfflineQueueStatus,
  type OfflineQueueStatus as QueueStatus,
} from "../browser/offline-queue-client";
import { scannerWorkerMessage } from "../browser/scanner-worker-message";

export function OfflineQueueStatus({ session, expiresAt }: { session: string; expiresAt: number }) {
  const [status, setStatus] = useState<QueueStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const generation = useRef(0);
  const flight = useRef<{ generation: number; promise: Promise<void> } | null>(null);
  const update = useCallback(
    (sync: boolean) => {
      const current = generation.current;
      if (flight.current?.generation === current) return flight.current.promise;
      const active = () => generation.current === current && expiresAt > Date.now();
      const work = (async () => {
        if (!active()) return;
        setBusy(true);
        try {
          if (sync && navigator.onLine) await scannerWorkerMessage("SYNC_OFFLINE_QUEUE", session);
          const next = await readOfflineQueueStatus(session);
          if (active()) setStatus(next);
        } finally {
          if (active()) setBusy(false);
          if (flight.current?.generation === current) flight.current = null;
        }
      })();
      flight.current = { generation: current, promise: work };
      return work;
    },
    [session, expiresAt],
  );
  useEffect(() => {
    const mountedGeneration = ++generation.current;
    const resume = () => {
      if (document.visibilityState === "visible") void update(true);
    };
    const changed = () => {
      void update(false);
    };
    window.addEventListener("online", resume);
    window.addEventListener("offline-queue-changed", changed);
    document.addEventListener("visibilitychange", resume);
    const timer = setInterval(resume, 15_000);
    void update(true);
    return () => {
      generation.current = mountedGeneration + 1;
      clearInterval(timer);
      window.removeEventListener("online", resume);
      window.removeEventListener("offline-queue-changed", changed);
      document.removeEventListener("visibilitychange", resume);
    };
  }, [update]);
  if (!status)
    return (
      <section aria-label="Saved gate records" className="space-y-3 text-lg">
        <p>
          Saved records could not be checked. Keep this phone’s data and ask the gate lead if this
          continues.
        </p>
        <Button
          variant="secondary"
          size="lg"
          disabled={busy}
          onClick={() => {
            void update(true);
          }}
        >
          Check saved records
        </Button>
      </section>
    );
  return (
    <section aria-label="Saved gate records" className="space-y-3 text-lg">
      <p role="status">
        {status.pending
          ? `${status.pending} ${status.pending === 1 ? "record is" : "records are"} waiting to sync.`
          : "No records are waiting for this operator."}
      </p>
      {status.refreshRequired && (
        <p>
          Saved receipts are confirmed. Refreshing the guest list is required before another offline
          entry.
        </p>
      )}
      {status.otherOperator > 0 && (
        <p>
          {status.otherOperator} saved records belong to another operator. Ask that operator to sign
          in on this phone to send them.
        </p>
      )}
      {(status.rejected > 0 || status.conflicts > 0) && (
        <p>
          Some records need the gate lead’s review. Keep this phone’s data; do not admit anyone
          again from an old receipt.
        </p>
      )}
      <Button
        variant="secondary"
        size="lg"
        disabled={busy}
        onClick={() => {
          void update(true);
        }}
      >
        {busy ? "Checking saved records…" : "Retry sync"}
      </Button>
    </section>
  );
}
