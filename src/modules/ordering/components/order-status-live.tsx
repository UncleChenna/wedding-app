"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  isSettled,
  nextPollMs,
  orderStatusCopy,
  orderStatusSchema,
  type OrderStatusView,
} from "../lib/order-status";

type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;

// Stable across renders, so the polling effect doesn't restart on every render.
const browserFetch: Fetcher = (input, init) => fetch(input, init);

/**
 * Keeps one station's status current on the guest's page (ORD-3). Guests poll their own receipt
 * (ADR 0024: no browser Realtime for guests), every 1.5s while in progress, backing off after a
 * failure or when told to wait, and stopping once everything is served or cancelled.
 */
export function useOrderStatus(orderId: string, fetcher: Fetcher = browserFetch) {
  const [view, setView] = useState<OrderStatusView | null>(null);
  const [slow, setSlow] = useState(false);
  // A ref, not an effect dependency: a production build doesn't keep the default fetcher
  // identical between renders, and a changing dependency restarted polling on every render.
  const fetchRef = useRef(fetcher);
  useEffect(() => {
    fetchRef.current = fetcher;
  });

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let failures = 0;
    const poll = async () => {
      let retryAfter: number | undefined;
      try {
        const response = await fetchRef.current(`/api/orders/${orderId}/status`, {
          cache: "no-store",
        });
        if (response.status === 429) retryAfter = Number(response.headers.get("Retry-After")) || 5;
        const parsed = orderStatusSchema.safeParse(response.ok ? await response.json() : null);
        if (parsed.success) {
          if (cancelled) return;
          failures = 0;
          setSlow(false);
          setView(parsed.data);
          if (isSettled(parsed.data)) return;
        } else {
          failures += 1;
        }
      } catch {
        failures += 1;
      }
      if (cancelled) return;
      if (failures >= 2) setSlow(true);
      timer = setTimeout(() => void poll(), nextPollMs(failures, retryAfter));
    };
    void poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [orderId]);

  return { view, slow };
}

/** The status line under one station's items. */
export function OrderStatusLine({
  view,
  station,
  slow,
}: {
  view: OrderStatusView | null;
  station: "kitchen" | "bar";
  slow: boolean;
}) {
  const row = view?.stations.find((item) => item.station === station);
  const text = row ? orderStatusCopy[row.status] : orderStatusCopy.checking;
  return (
    <p
      className="mt-4 text-lg leading-relaxed"
      aria-live="polite"
      data-station-status={row?.status ?? "checking"}
    >
      <span className="mr-3 type-label text-muted-foreground">Status</span>
      <span className="font-medium">{text}</span>
      {slow && row?.status !== "served" ? (
        <span className="mt-1 block text-base text-muted-foreground">{orderStatusCopy.paused}</span>
      ) : null}
    </p>
  );
}

/** Polls once per order and hands the result to every station group on the sent screen. */
export function LiveOrderStatus({
  orderId,
  fetcher,
  children,
}: {
  orderId: string;
  fetcher?: Fetcher;
  children: (status: { view: OrderStatusView | null; slow: boolean }) => ReactNode;
}) {
  return children(useOrderStatus(orderId, fetcher));
}
