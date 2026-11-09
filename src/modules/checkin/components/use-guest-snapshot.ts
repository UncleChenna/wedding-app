"use client";

import { useMemo, useSyncExternalStore } from "react";
import { readGuestSnapshot } from "../browser/guest-snapshot-client";
import { scannerWorkerMessage } from "../browser/scanner-worker-message";
import { scannerInvalidated } from "../browser/scanner-invalidation";
import type { GuestSnapshotSummary } from "./guest-snapshot-status";

interface FreshnessState {
  summary: GuestSnapshotSummary | null;
  refreshing: boolean;
  failed: boolean;
  now: number;
}

/** External browser subscription: React stores metadata only, never household rows. */
function snapshotState(session: string, expiresAt: number) {
  const initial: FreshnessState = { summary: null, refreshing: true, failed: false, now: 0 };
  let state = initial;
  let generation = 0;
  let closed = false;
  let pending: Promise<void> | null = null;
  let refreshAfterCurrent = false;
  const listeners = new Set<() => void>();
  const update = (patch: Partial<FreshnessState>) => {
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener());
  };
  const lock = () => {
    closed = true;
    generation += 1;
    pending = null;
    refreshAfterCurrent = false;
    update({ summary: null, refreshing: false });
  };
  async function run(request: number) {
    const active = () => !closed && generation === request && expiresAt > Date.now();
    update({ refreshing: true });
    try {
      const result = navigator.onLine
        ? await scannerWorkerMessage("REFRESH_GUEST_SNAPSHOT", session)
        : null;
      if (!active()) return;
      const snapshot = await readGuestSnapshot({ session, expiresAt });
      if (!active()) return;
      update({
        summary: snapshot
          ? { generatedAt: snapshot.generatedAt, expiresAt: snapshot.expiresAt }
          : null,
        failed: !(
          typeof result === "object" &&
          result !== null &&
          "state" in result &&
          result.state === "ready"
        ),
        now: Date.now(),
      });
    } catch {
      if (active()) update({ failed: true, summary: null });
    } finally {
      if (active()) update({ refreshing: false });
    }
  }
  function refresh(afterCurrent = false): Promise<void> {
    if (closed || expiresAt <= Date.now()) return Promise.resolve();
    if (pending) {
      // A known admission can request exactly one follow-up after the earlier projection.
      refreshAfterCurrent ||= afterCurrent;
      return pending;
    }
    const operation = run(++generation);
    pending = operation;
    void operation.finally(() => {
      if (pending !== operation) return;
      pending = null;
      if (refreshAfterCurrent) {
        refreshAfterCurrent = false;
        void refresh();
      }
    });
    return operation;
  }
  return {
    current: () => state,
    server: () => initial,
    refresh,
    subscribe(listener: () => void) {
      listeners.add(listener);
      closed = false;
      let timer: ReturnType<typeof setTimeout>;
      const tick = () => {
        clearTimeout(timer);
        const now = Date.now();
        update({ now });
        if (!Number.isSafeInteger(expiresAt) || expiresAt <= now) {
          lock();
          void scannerWorkerMessage("SCANNER_STATUS");
        } else timer = setTimeout(tick, Math.min(30_000, expiresAt - now));
      };
      const resume = () => {
        if (!document.hidden) {
          tick();
          void refresh();
        }
      };
      const message = (event: MessageEvent<unknown>) => {
        if (scannerInvalidated(event.data, { session, expiresAt })) {
          lock();
          return;
        }
        const data = event.data;
        if (
          typeof data === "object" &&
          data !== null &&
          "type" in data &&
          data.type === "SCANNER_INVALIDATED"
        )
          void refresh();
      };
      const background = setInterval(() => {
        if (!document.hidden) void refresh();
      }, 5 * 60_000);
      window.addEventListener("online", resume);
      window.addEventListener("focus", resume);
      document.addEventListener("visibilitychange", resume);
      navigator.serviceWorker?.addEventListener("message", message);
      let channel: BroadcastChannel | null = null;
      try {
        if (typeof BroadcastChannel !== "undefined") {
          channel = new BroadcastChannel("wedding-scanner-session-v1");
          channel.addEventListener("message", message);
        }
      } catch {
        /* Service-worker messages and deadline checks remain active. */
      }
      tick();
      void refresh();
      return () => {
        listeners.delete(listener);
        closed = true;
        generation += 1;
        pending = null;
        refreshAfterCurrent = false;
        clearTimeout(timer);
        clearInterval(background);
        window.removeEventListener("online", resume);
        window.removeEventListener("focus", resume);
        document.removeEventListener("visibilitychange", resume);
        navigator.serviceWorker?.removeEventListener("message", message);
        channel?.close();
        if (expiresAt <= Date.now()) void scannerWorkerMessage("SCANNER_STATUS");
      };
    },
  };
}

export function useGuestSnapshot({ session, expiresAt }: { session: string; expiresAt: number }) {
  const store = useMemo(() => snapshotState(session, expiresAt), [session, expiresAt]);
  const state = useSyncExternalStore(store.subscribe, store.current, store.server);
  return { ...state, refresh: store.refresh };
}
