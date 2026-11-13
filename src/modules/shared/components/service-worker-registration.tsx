"use client";

import { useEffect, useRef, useState } from "react";
import {
  reloadWithEmptyQueue,
  watchWorkerUpdates,
  type UpdateView,
} from "../browser/worker-update-client";
import { WorkerUpdatePrompt } from "./worker-update-prompt";

/**
 * Registers /sw.js in production builds only (ADR 0014: no worker in development, so
 * hot reload is never served from cache). Failure is silent: the site works without it.
 */
export function ServiceWorkerRegistration() {
  const [value, setValue] = useState<UpdateView>({ state: "hidden" });
  const watcher = useRef<ReturnType<typeof watchWorkerUpdates> | null>(null);
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    let disposed = false;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch(() => navigator.serviceWorker.getRegistration("/"))
      .then((registration) => {
        if (disposed || !registration) return;
        watcher.current = watchWorkerUpdates(
          registration,
          navigator.serviceWorker,
          setValue,
          async () => {
            const [{ createOfflineQueueStore }, { createOfflineQueuePolicy }] = await Promise.all([
              import("@/modules/checkin/browser/offline-queue-store"),
              import("@/modules/checkin/lib/offline-queue"),
            ]);
            return reloadWithEmptyQueue({
              locks: navigator.locks,
              read: () => createOfflineQueueStore(createOfflineQueuePolicy()).read(),
              reload: () => {
                if (!disposed) window.location.reload();
              },
            });
          },
        );
      })
      .catch(() => {
        // Unsupported or blocked (private mode, old browser): pages still load from the network.
      });
    return () => {
      disposed = true;
      watcher.current?.dispose();
      watcher.current = null;
    };
  }, []);
  return (
    <WorkerUpdatePrompt
      value={value}
      onReload={() => {
        void watcher.current?.accept();
      }}
      onLater={() => watcher.current?.dismiss()}
    />
  );
}
