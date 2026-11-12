"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Scanner, readLivePass, type ScanResolver } from "./scanner";
import { GuestSnapshotStatus } from "./guest-snapshot-status";
import { useGuestSnapshot } from "./use-guest-snapshot";
import { readGuestSnapshot } from "../browser/guest-snapshot-client";
import { scannerWorkerMessage } from "../browser/scanner-worker-message";
import { resolveSnapshotRead } from "../lib/resolve-snapshot-read";
import { ScannerSession } from "./scanner-session";
import { createStationClient } from "@/modules/shared/lib/station-client";
import { startScannerUpdates } from "../lib/scanner-updates";

export function GuestSnapshotScanner({
  session,
  expiresAt,
  realtime,
}: {
  session: string;
  expiresAt: number;
  realtime?: { url: string; publishableKey: string };
}) {
  const freshness = useGuestSnapshot({ session, expiresAt });
  const refresh = freshness.refresh;
  const unsafeCache = useRef(false);
  const invalidationGeneration = useRef(0);
  const invalidate = useCallback(async () => {
    // Never fall back to a copy already contradicted by an authoritative read or
    // receipt. Only invalidate our session's private copy; preserve shell/queues.
    unsafeCache.current = true;
    const generation = ++invalidationGeneration.current;
    const cleared = await scannerWorkerMessage("INVALIDATE_GUEST_SNAPSHOT", session);
    if (
      generation === invalidationGeneration.current &&
      typeof cleared === "object" &&
      cleared !== null &&
      "privateSnapshotRemoved" in cleared &&
      cleared.privateSnapshotRemoved === true
    )
      unsafeCache.current = false;
  }, [session]);
  const changed = useCallback(async () => {
    await invalidate();
    void refresh(true);
  }, [invalidate, refresh]);
  // This describes the last read, not connectivity. Reconnecting must never turn
  // an old cached result into a newly authorized admission form.
  const [cached, setCached] = useState(false);
  const [deniedSession, setDeniedSession] = useState<string | null>(null);
  const resolveRead = useCallback<ScanResolver>(
    async (qr, signal) => {
      if (navigator.onLine) {
        const transport = new AbortController();
        const abort = () => transport.abort();
        signal.addEventListener("abort", abort, { once: true });
        if (signal.aborted) abort();
        const timer = setTimeout(abort, 5000);
        try {
          const live = await readLivePass(qr, transport.signal);
          if (live.state === "session_expired") {
            if (signal.aborted) return live;
            invalidationGeneration.current++;
            unsafeCache.current = true;
            setDeniedSession(session);
            await scannerWorkerMessage("DENY_SCANNER_SESSION", session);
            return live;
          }
          if (live.state !== "unavailable") {
            if (!signal.aborted) {
              setCached(false);
              if (live.state !== "invalid") await changed();
            }
            return live;
          }
        } catch {
          /* A failed read can use the still-authorized private snapshot. */
        } finally {
          clearTimeout(timer);
          signal.removeEventListener("abort", abort);
          transport.abort();
        }
      }
      if (signal.aborted) return { state: "unavailable" };
      if (unsafeCache.current) return { state: "unavailable" };
      const generation = invalidationGeneration.current;
      const snapshot = await readGuestSnapshot({ session, expiresAt });
      if (signal.aborted || unsafeCache.current || generation !== invalidationGeneration.current)
        return { state: "unavailable" };
      const result = snapshot
        ? await resolveSnapshotRead(qr, window.location.origin, snapshot, { session, expiresAt })
        : { state: "unavailable" as const };
      if (signal.aborted || unsafeCache.current || generation !== invalidationGeneration.current)
        return { state: "unavailable" };
      setCached(true);
      return result;
    },
    [session, expiresAt, changed],
  );
  const refreshRead = useCallback<ScanResolver>(
    async (qr, signal) => {
      if (signal.aborted || unsafeCache.current) return { state: "unavailable" };
      const generation = invalidationGeneration.current;
      const snapshot = await readGuestSnapshot({ session, expiresAt });
      if (signal.aborted || unsafeCache.current || generation !== invalidationGeneration.current)
        return { state: "unavailable" };
      const result = snapshot
        ? await resolveSnapshotRead(qr, window.location.origin, snapshot, { session, expiresAt })
        : { state: "unavailable" as const };
      return signal.aborted || unsafeCache.current || generation !== invalidationGeneration.current
        ? { state: "unavailable" }
        : result;
    },
    [session, expiresAt],
  );
  useEffect(() => {
    if (deniedSession === session || expiresAt <= Date.now()) return;
    const client = realtime
      ? createStationClient(realtime.url, realtime.publishableKey)
      : undefined;
    const stop = startScannerUpdates({
      client,
      invalidate,
      refresh: () => refresh(true),
      signedOut: () => {
        invalidationGeneration.current++;
        unsafeCache.current = true;
        setDeniedSession(session);
        void scannerWorkerMessage("DENY_SCANNER_SESSION", session);
      },
    });
    return () => {
      stop();
      client?.disconnect();
    };
  }, [session, expiresAt, deniedSession, refresh, invalidate, realtime]);
  if (deniedSession === session)
    return (
      <ScannerSession expiresAt={0} session={session}>
        {null}
      </ScannerSession>
    );
  const age = freshness.summary
    ? Math.max(0, Math.floor((freshness.now - freshness.summary.generatedAt) / 60_000))
    : 0;
  return (
    <>
      {cached && (
        <p className="text-lg leading-relaxed">
          Using the saved guest list. No entry is recorded by an offline check. Reconnect and scan
          again to record entry.
        </p>
      )}
      <Scanner
        key={session}
        resolveRead={resolveRead}
        refreshRead={refreshRead}
        readRevision={freshness.summary?.generatedAt}
        allowAdmission={!cached}
        readOnlyNotice={
          cached && age >= 30
            ? `List not refreshed for ${age} min. New changes may not show.`
            : undefined
        }
        onAdmissionOutcome={(outcome) => {
          // A refusal is just as authoritative as a receipt: the cached allowance,
          // RSVP or revocation state may have changed after the initial live read.
          if (outcome.state === "session_expired") {
            invalidationGeneration.current++;
            unsafeCache.current = true;
            setDeniedSession(session);
            void scannerWorkerMessage("DENY_SCANNER_SESSION", session);
          } else {
            void changed();
          }
        }}
      />
      <GuestSnapshotStatus
        {...freshness}
        refresh={() => {
          void refresh();
        }}
      />
    </>
  );
}
