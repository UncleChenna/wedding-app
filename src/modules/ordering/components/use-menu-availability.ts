"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  MENU_POLL_INTERVAL_MS,
  menuAvailabilitySchema,
  menuCopy,
  type MenuItem,
} from "../lib/menu";

export const MENU_AVAILABILITY_URL = "/api/menu/availability";

/**
 * Live sold-out state for an open order page (TICKET-071). Polls while the tab is visible and
 * once on return; failed or malformed polls keep the last known state. `onSoldOut` lets the
 * page drop those items from the guest's choices.
 */
export function useMenuAvailability(
  items: readonly MenuItem[],
  {
    pollIntervalMs = MENU_POLL_INTERVAL_MS,
    onSoldOut,
    initialOpen = true,
  }: {
    pollIntervalMs?: number;
    onSoldOut: (ids: string[]) => void;
    /** Whether guest ordering was open when the page rendered (ORD-7); polls keep it current. */
    initialOpen?: boolean;
  },
) {
  const [available, setAvailable] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(items.map((item) => [item.id, item.available])),
  );
  const [open, setOpen] = useState(initialOpen);
  const [announcement, setAnnouncement] = useState("");
  const openRef = useRef(initialOpen);
  const current = useRef(available);
  const soldOutHandler = useRef(onSoldOut);
  useEffect(() => {
    soldOutHandler.current = onSoldOut;
  }, [onSoldOut]);

  const apply = useCallback(
    (changes: readonly { id: string; available: boolean }[]) => {
      const names = new Map(items.map((item) => [item.id, item.name]));
      const next = { ...current.current };
      const soldOut: string[] = [];
      const restocked: string[] = [];
      for (const { id, available } of changes) {
        // Items added after the page loaded wait for a reload; only known items change state.
        if (!(id in next) || next[id] === available) continue;
        next[id] = available;
        (available ? restocked : soldOut).push(id);
      }
      if (!soldOut.length && !restocked.length) return;
      current.current = next;
      setAvailable(next);
      // Sold-out items leave the guest's choices; the server still rechecks at submission.
      if (soldOut.length) soldOutHandler.current(soldOut);
      setAnnouncement(
        [
          ...soldOut.map((id) => menuCopy.justSoldOut(names.get(id) ?? "")),
          ...restocked.map((id) => menuCopy.backInStock(names.get(id) ?? "")),
        ].join(" "),
      );
    },
    [items],
  );

  useEffect(() => {
    let cancelled = false;
    let inFlight = false;
    async function poll() {
      if (inFlight || document.visibilityState === "hidden") return;
      inFlight = true;
      try {
        const response = await fetch(MENU_AVAILABILITY_URL, { cache: "no-store" });
        if (!response.ok) return;
        const parsed = menuAvailabilitySchema.safeParse(await response.json());
        if (!parsed.success || cancelled) return;
        apply(parsed.data.items);
        if (parsed.data.open !== openRef.current) {
          openRef.current = parsed.data.open;
          setOpen(parsed.data.open);
          setAnnouncement(parsed.data.open ? menuCopy.reopened : menuCopy.paused);
        }
      } catch {
        // Keep the last known state; the next poll retries.
      } finally {
        inFlight = false;
      }
    }
    const timer = setInterval(() => void poll(), pollIntervalMs);
    const onVisible = () => {
      if (document.visibilityState === "visible") void poll();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [apply, pollIntervalMs]);

  /** Marks items sold out immediately, e.g. when the server refused them at submission. */
  const markSoldOut = useCallback(
    (ids: readonly string[]) => apply(ids.map((id) => ({ id, available: false }))),
    [apply],
  );
  /** The server refused a submission because ordering closed; show it at once. */
  const markClosed = useCallback(() => {
    openRef.current = false;
    setOpen(false);
  }, []);
  return { available, open, announcement, markSoldOut, markClosed };
}
