"use client";

import { useMemo, useSyncExternalStore, type ReactNode } from "react";

/** Browser timers may be suspended; event-time checks guard every camera interaction too. */
function sessionClock(expiresAt: number) {
  let closed = !Number.isSafeInteger(expiresAt) || expiresAt <= 0;
  const listeners = new Set<() => void>();
  const valid = () => {
    if (Date.now() >= expiresAt) closed = true;
    return !closed;
  };
  const notify = () => listeners.forEach((listener) => listener());
  return {
    valid,
    invalidate() {
      closed = true;
      notify();
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      let timer: ReturnType<typeof setTimeout>;
      const check = () => {
        clearTimeout(timer);
        if (!valid()) notify();
        else timer = setTimeout(check, Math.min(expiresAt - Date.now(), 60_000));
      };
      const message = (event: MessageEvent<unknown>) => {
        if (
          typeof event.data === "object" &&
          event.data !== null &&
          "type" in event.data &&
          event.data.type === "SCANNER_INVALIDATED"
        ) {
          closed = true;
          check();
        }
      };
      window.addEventListener("focus", check);
      window.addEventListener("pageshow", check);
      document.addEventListener("visibilitychange", check);
      navigator.serviceWorker?.addEventListener("message", message);
      check();
      return () => {
        clearTimeout(timer);
        listeners.delete(listener);
        window.removeEventListener("focus", check);
        window.removeEventListener("pageshow", check);
        document.removeEventListener("visibilitychange", check);
        navigator.serviceWorker?.removeEventListener("message", message);
      };
    },
  };
}

/** Unmounting Scanner stops every camera track through its existing lifecycle cleanup. */
export function ScannerSession({
  expiresAt,
  children,
}: {
  expiresAt: number;
  children: ReactNode;
}) {
  const clock = useMemo(() => sessionClock(expiresAt), [expiresAt]);
  const active = useSyncExternalStore(
    clock.subscribe,
    clock.valid,
    () => Number.isSafeInteger(expiresAt) && expiresAt > 0,
  );
  if (!active)
    return (
      <section role="status" className="flex flex-col gap-4 text-lg leading-relaxed">
        <h2 className="font-display text-3xl">Scanner locked</h2>
        <p>Reconnect and sign in to continue.</p>
        <a
          href="/staff"
          className="inline-flex min-h-11 items-center text-primary underline underline-offset-4"
        >
          Sign in online
        </a>
      </section>
    );
  return (
    <div
      onClickCapture={(event) => {
        if (!clock.valid()) {
          event.preventDefault();
          event.stopPropagation();
          clock.invalidate();
        }
      }}
    >
      {children}
    </div>
  );
}
