"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { gateConflictsSchema, type GateConflictsState } from "../lib/gate-conflicts";
/** Online memory only. A response from a replaced/expired session can never publish. */
export function useGateConflicts(session: string, expiresAt: number) {
  const [view, setView] = useState<{ session: string; value: GateConflictsState }>({
    session,
    value: { state: "loading" },
  });
  const active = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    // Supersede older reads rather than publishing an out-of-order conflict list.
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    generation.current += 1;
    const own = generation.current;
    const publish = (value: GateConflictsState) => {
      if (!controller.signal.aborted && generation.current === own) setView({ session, value });
    };
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      if (Date.now() >= expiresAt) {
        publish({ state: "denied" });
        return;
      }
      const response = await fetch("/api/checkin/conflicts", {
        cache: "no-store",
        credentials: "same-origin",
        signal: controller.signal,
      });
      if (response.status === 401 || response.status === 403) {
        publish({ state: "denied" });
        return;
      }
      if (!response.ok) throw new Error("Conflict list unavailable");
      const parsed = gateConflictsSchema.safeParse(await response.json());
      if (!parsed.success || parsed.data.session !== session)
        throw new Error("Conflict session changed");
      if (Math.min(expiresAt, parsed.data.expiresAt) <= Date.now()) {
        publish({ state: "denied" });
        return;
      }
      publish({ state: "ready", entries: parsed.data.entries });
    } catch {
      if (generation.current === own) setView({ session, value: { state: "unavailable" } });
    } finally {
      clearTimeout(timeout);
    }
  }, [session, expiresAt]);
  useEffect(() => {
    void refresh();
    const offline = () => {
      generation.current += 1;
      active.current?.abort();
      setView({ session, value: { state: "unavailable" } });
    };
    window.addEventListener("offline", offline);
    window.addEventListener("online", refresh);
    return () => {
      generation.current += 1;
      active.current?.abort();
      window.removeEventListener("offline", offline);
      window.removeEventListener("online", refresh);
    };
  }, [session, refresh]);
  return { value: view.session === session ? view.value : { state: "loading" as const }, refresh };
}
