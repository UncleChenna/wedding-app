"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/modules/shared/components/ui/button";
import { Card } from "@/modules/shared/components/ui/card";
import { clientEnv } from "@/modules/shared/lib/env/client";
import { cn } from "@/modules/shared/lib/cn";
import { subscribeStation, type StationChannelStatus } from "@/modules/shared/lib/station-channel";
import { createStationClient } from "@/modules/shared/lib/station-client";
import {
  kitchenBoardSchema,
  newTicketIds,
  ticketAge,
  type KitchenBoard as Board,
  type KitchenTicket,
} from "../lib/station-board";

const FLASH_MS = 4_000;

/** A short two-note chime made in the browser, so no audio file has to load. */
function chime(context: AudioContext) {
  const start = context.currentTime;
  for (const [offset, frequency] of [
    [0, 880],
    [0.18, 1320],
  ] as const) {
    const tone = context.createOscillator();
    const gain = context.createGain();
    tone.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, start + offset);
    gain.gain.exponentialRampToValueAtTime(0.4, start + offset + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + 0.3);
    tone.connect(gain).connect(context.destination);
    tone.start(start + offset);
    tone.stop(start + offset + 0.32);
  }
}

/** Keeps the tablet awake while the board is open, where the browser allows it. */
function useWakeLock() {
  useEffect(() => {
    if (!("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;
    const request = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        lock = await navigator.wakeLock.request("screen");
        if (cancelled) void lock.release();
      } catch {
        // Battery saver or a browser policy refused; the board still works.
      }
    };
    void request();
    document.addEventListener("visibilitychange", request);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", request);
      void lock?.release();
    };
  }, []);
}

function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}

const liveLabels: Record<StationChannelStatus, string> = {
  connecting: "Connecting…",
  live: "Live",
  reconnecting: "Reconnecting… checking for orders",
  "signed-out": "Signed out",
};

export function KitchenBoard({ initial }: { initial: Board }) {
  const [tickets, setTickets] = useState(initial.tickets);
  const [flashing, setFlashing] = useState<ReadonlySet<string>>(new Set());
  const [live, setLive] = useState<StationChannelStatus>("connecting");
  const [signedOut, setSignedOut] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const audio = useRef<AudioContext | null>(null);
  const known = useRef(initial.tickets);
  const now = useNow(30_000);
  useWakeLock();

  const announce = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    setFlashing((current) => new Set([...current, ...ids]));
    setTimeout(() => {
      setFlashing((current) => new Set([...current].filter((id) => !ids.includes(id))));
    }, FLASH_MS);
    if (audio.current?.state === "running") chime(audio.current);
  }, []);

  const refetch = useCallback(async () => {
    try {
      const response = await fetch("/api/kitchen/board", { cache: "no-store" });
      if (response.status === 403) {
        setSignedOut(true);
        return;
      }
      const parsed = kitchenBoardSchema.safeParse(response.ok ? await response.json() : null);
      if (!parsed.success) return;
      announce(newTicketIds(known.current, parsed.data.tickets));
      known.current = parsed.data.tickets;
      setTickets(parsed.data.tickets);
    } catch {
      // Offline for a moment: keep showing the last board; the channel retries and refetches.
    }
  }, [announce]);

  useEffect(() => {
    const client = createStationClient(
      clientEnv.NEXT_PUBLIC_SUPABASE_URL,
      clientEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    );
    const stop = subscribeStation({
      station: "kitchen",
      client,
      onEvent: () => void refetch(),
      onResync: () => void refetch(),
      onStatus: (status) => {
        setLive(status);
        if (status === "signed-out") setSignedOut(true);
      },
    });
    return () => {
      stop();
      client.disconnect();
    };
  }, [refetch]);

  const turnOnSound = async () => {
    try {
      audio.current ??= new AudioContext();
      await audio.current.resume();
      setSoundOn(audio.current.state === "running");
      if (audio.current.state === "running") chime(audio.current);
    } catch {
      setSoundOn(false);
    }
  };

  if (signedOut) {
    return (
      <p role="alert" className="text-lg leading-relaxed">
        This device was signed out. Reload the page and sign in with your PIN.
      </p>
    );
  }

  return (
    <section aria-labelledby="kitchen-orders" className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 id="kitchen-orders" className="font-display text-3xl leading-tight md:text-4xl">
          {tickets.length === 0
            ? "No orders waiting"
            : `${tickets.length} ${tickets.length === 1 ? "order" : "orders"} waiting`}
        </h2>
        <div className="flex flex-wrap items-center gap-4">
          <p
            role="status"
            className={cn(
              "rounded-full px-4 py-2 text-lg font-medium",
              live === "live"
                ? "bg-success-subtle text-success-subtle-foreground"
                : "bg-warning-subtle text-warning-subtle-foreground",
            )}
          >
            {liveLabels[live]}
          </p>
          {soundOn ? (
            <p className="text-lg">Sound on</p>
          ) : (
            <Button type="button" size="lg" variant="secondary" onClick={() => void turnOnSound()}>
              Turn on sound
            </Button>
          )}
        </div>
      </div>

      {tickets.length === 0 ? (
        <p className="text-lg leading-relaxed text-muted-foreground">
          New orders appear here, oldest first.
        </p>
      ) : (
        <ol className="grid gap-6 md:grid-cols-2 xl:grid-cols-3" aria-label="Orders, oldest first">
          {tickets.map((ticket) => (
            <li key={ticket.id}>
              <TicketCard ticket={ticket} now={now} isNew={flashing.has(ticket.id)} />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function TicketCard({
  ticket,
  now,
  isNew,
}: {
  ticket: KitchenTicket;
  now: number;
  isNew: boolean;
}) {
  return (
    <Card className="relative h-full overflow-hidden">
      {/* The flash fades by opacity only; "New" says the same thing without colour. */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 bg-warning-subtle transition-opacity duration-300 motion-reduce:transition-none",
          isNew ? "opacity-100" : "opacity-0",
        )}
      />
      <div className="relative flex flex-col gap-4 p-6 text-lg leading-relaxed">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="font-display text-4xl leading-tight">
            Table {ticket.table.number}
            {ticket.table.name ? (
              <span className="block font-sans text-lg text-muted-foreground">
                {ticket.table.name}
              </span>
            ) : null}
          </h3>
          <p className="shrink-0 text-lg font-medium">
            {isNew ? <span className="mr-3 tracking-widest uppercase">New</span> : null}
            <time dateTime={ticket.createdAt}>{ticketAge(ticket.createdAt, now)}</time>
          </p>
        </div>
        <ul className="flex flex-col gap-1 text-xl" aria-label="Items">
          {ticket.items.map((item, index) => (
            <li key={`${item.name}-${index}`}>
              <span className="font-semibold">{item.quantity} ×</span> {item.name}
            </li>
          ))}
        </ul>
        {ticket.note ? (
          <p>
            <span className="text-sm tracking-widest uppercase">Note</span>
            <span className="block">{ticket.note}</span>
          </p>
        ) : null}
        {ticket.dietary.length > 0 ? (
          <div className="rounded-md border border-warning bg-warning-subtle p-4 text-warning-subtle-foreground">
            <p className="text-sm font-medium tracking-widest uppercase">Dietary at this table</p>
            <ul className="mt-2 flex flex-col gap-1">
              {ticket.dietary.map((row) => (
                <li key={`${row.guest}-${row.note}`}>
                  <span className="font-semibold">{row.guest}:</span> {row.note}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
