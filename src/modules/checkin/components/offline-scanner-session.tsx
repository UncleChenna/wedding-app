"use client";

import { useEffect, useState, type ReactNode } from "react";
import { scannerReady, scannerWorkerMessage } from "../browser/scanner-worker-message";
import { scannerInvalidated } from "../browser/scanner-invalidation";
import { ScannerSession } from "./scanner-session";

/** Reconcile durable authorization before mounting the camera, including a missed broadcast. */
export function OfflineScannerSession({
  session,
  build,
  expiresAt,
  children,
}: {
  session: string;
  build: string;
  expiresAt: number;
  children: ReactNode;
}) {
  const [deadline, setDeadline] = useState<number | null>(null);
  useEffect(() => {
    let closed = false;
    let sequence = 0;
    const close = () => {
      closed = true;
      setDeadline(0);
    };
    const check = async () => {
      const request = ++sequence;
      const result = await scannerWorkerMessage("SCANNER_STATUS");
      if (closed || request !== sequence) return;
      if (!scannerReady(result) || result.session !== session || result.build !== build) close();
      else setDeadline(Math.min(expiresAt, result.expiresAt));
    };
    const message = (event: MessageEvent<unknown>) => {
      if (scannerInvalidated(event.data, { session, build, expiresAt })) close();
    };
    navigator.serviceWorker?.addEventListener("message", message);
    const channel =
      typeof BroadcastChannel === "undefined"
        ? null
        : new BroadcastChannel("wedding-scanner-session-v1");
    channel?.addEventListener("message", message);
    window.addEventListener("focus", check);
    window.addEventListener("pageshow", check);
    document.addEventListener("visibilitychange", check);
    void check();
    return () => {
      closed = true;
      navigator.serviceWorker?.removeEventListener("message", message);
      channel?.close();
      window.removeEventListener("focus", check);
      window.removeEventListener("pageshow", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, [session, build, expiresAt]);
  if (deadline === null)
    return (
      <p role="status" className="text-lg leading-relaxed">
        Checking saved scanner access…
      </p>
    );
  return (
    <ScannerSession expiresAt={deadline} session={session}>
      {children}
    </ScannerSession>
  );
}
