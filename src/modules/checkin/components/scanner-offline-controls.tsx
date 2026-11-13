"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  startTransition,
  type FormEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/modules/shared/components/ui/button";
import { scannerReady, scannerWorkerMessage } from "../browser/scanner-worker-message";
import { clearScannerForSignOut } from "../browser/scanner-sign-out";
import { ScannerSession } from "./scanner-session";

export function ScannerOfflineControls({
  expiresAt,
  session,
  signOut,
  clearSession,
  children,
}: {
  expiresAt: number;
  session: string;
  signOut: () => Promise<void>;
  clearSession: () => Promise<void>;
  children: ReactNode;
}) {
  const router = useRouter();
  const [state, setState] = useState<"waiting" | "preparing" | "ready" | "unavailable">("waiting");
  const [locked, setLocked] = useState(false);
  const [signOutFailed, setSignOutFailed] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const generation = useRef(0);

  const closed = useRef(false);

  const prepare = useCallback(async () => {
    if (closed.current) return;
    const request = ++generation.current;
    setState("preparing");
    {
      const result = await scannerWorkerMessage("SAVE_SCANNER");
      if (closed.current || request !== generation.current) return;
      const saved =
        typeof result === "object" &&
        result !== null &&
        "state" in result &&
        result.state === "ready";
      const status = saved ? await scannerWorkerMessage("SCANNER_STATUS") : null;
      if (closed.current || request !== generation.current) return;
      setState(
        scannerReady(status) && status.session === session && status.expiresAt <= expiresAt
          ? "ready"
          : "unavailable",
      );
      window.dispatchEvent(new Event("scanner-preparation-complete"));
    }
  }, [expiresAt, session]);
  useEffect(() => {
    closed.current = false;
    const controlled = () => {
      if (navigator.serviceWorker?.controller) void prepare();
    };
    navigator.serviceWorker?.addEventListener("controllerchange", controlled);
    controlled();
    return () => {
      closed.current = true;
      generation.current += 1;
      navigator.serviceWorker?.removeEventListener("controllerchange", controlled);
    };
  }, [prepare]);
  async function submitSignOut(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    closed.current = true;
    generation.current += 1;
    setLocked(true);
    setSigningOut(true);
    setSignOutFailed(false);
    try {
      if (!(await clearScannerForSignOut())) {
        setSignOutFailed(true);
        return;
      }
      await clearSession();
      // Clear again after the cookie is gone: another tab may have prepared using
      // the old cookie between the first invalidation and this server response.
      if (!(await clearScannerForSignOut())) {
        setSignOutFailed(true);
        return;
      }
      router.replace("/staff");
    } catch {
      setSignOutFailed(true);
    } finally {
      setSigningOut(false);
    }
  }
  return (
    <>
      <ScannerSession expiresAt={locked ? 0 : expiresAt} session={session}>
        {children}
      </ScannerSession>
      {!locked && (
        <section
          aria-label="Offline scanner"
          className="flex flex-col gap-3 text-lg leading-relaxed"
        >
          <p role="status" className="min-h-24">
            {state === "ready"
              ? "Camera ready for an offline reload. Saved guest checks do not record entry."
              : state === "preparing"
                ? "Preparing the camera for offline use…"
                : "Offline camera not ready. Keep this page connected while you prepare it."}
          </p>
          {!locked && (
            <Button
              size="lg"
              variant="secondary"
              disabled={state === "preparing"}
              onClick={() => void prepare()}
            >
              {state === "ready" ? "Refresh offline camera" : "Prepare offline camera"}
            </Button>
          )}
        </section>
      )}
      <form
        action={signOut}
        onSubmit={(event) => {
          event.preventDefault();
          setLocked(true);
          setSigningOut(true);
          startTransition(() => submitSignOut(event));
        }}
      >
        <Button size="lg" variant="secondary" type="submit" disabled={signingOut}>
          {signingOut ? "Signing out…" : "Sign out"}
        </Button>
        {signOutFailed && (
          <p role="alert" className="mt-3 text-lg leading-relaxed">
            The camera is locked here. Reconnect and try signing out again to clear saved access.
          </p>
        )}
      </form>
    </>
  );
}
