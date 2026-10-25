"use client";

import { useEffect } from "react";

/**
 * Registers /sw.js in production builds only (ADR 0014: no worker in development, so
 * hot reload is never served from cache). Failure is silent: the site works without it.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {
      // Unsupported or blocked (private mode, old browser): pages still load from the network.
    });
  }, []);
  return null;
}
