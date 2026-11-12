"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/modules/shared/components/ui/button";
import { Card } from "@/modules/shared/components/ui/card";
import { Sheet } from "@/modules/shared/components/ui/sheet";
import { Textarea } from "@/modules/shared/components/ui/textarea";
import { clientEnv } from "@/modules/shared/lib/env/client";
import { cn } from "@/modules/shared/lib/cn";
import { subscribeStation, type StationChannelStatus } from "@/modules/shared/lib/station-channel";
import { createStationClient } from "@/modules/shared/lib/station-client";
import {
  boardSchemas,
  newTicketIds,
  ticketAge,
  type BoardStation,
  type RecentTicket,
  type StationBoard as Board,
  type StationTicket,
} from "../lib/station-board";
import { MAX_CANCEL_REASON, type TicketStatus } from "../lib/ticket-status";

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

const headings = { kitchen: "kitchen-orders", bar: "bar-orders" } as const;

export function StationBoard({ station, initial }: { station: BoardStation; initial: Board }) {
  const [tickets, setTickets] = useState<StationTicket[]>(initial.tickets);
  const [recent, setRecent] = useState<RecentTicket[]>(initial.recent);
  const [problem, setProblem] = useState<string | null>(null);
  // Tickets with a move still saving: their buttons wait, so a quick second tap can't race the first.
  const [saving, setSaving] = useState<ReadonlySet<string>>(new Set());
  const [cancelling, setCancelling] = useState<StationTicket | null>(null);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [flashing, setFlashing] = useState<ReadonlySet<string>>(new Set());
  const [live, setLive] = useState<StationChannelStatus>("connecting");
  const [signedOut, setSignedOut] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const audio = useRef<AudioContext | null>(null);
  const known = useRef<StationTicket[]>(initial.tickets);
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
      const response = await fetch(`/api/${station}/board`, { cache: "no-store" });
      if (response.status === 403) {
        setSignedOut(true);
        return;
      }
      const parsed = boardSchemas[station].safeParse(response.ok ? await response.json() : null);
      if (!parsed.success) return;
      announce(newTicketIds(known.current, parsed.data.tickets));
      known.current = parsed.data.tickets;
      setTickets(parsed.data.tickets);
      setRecent(parsed.data.recent);
    } catch {
      // Offline for a moment: keep showing the last board; the channel retries and refetches.
    }
  }, [announce, station]);

  useEffect(() => {
    const client = createStationClient(
      clientEnv.NEXT_PUBLIC_SUPABASE_URL,
      clientEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    );
    const stop = subscribeStation({
      station,
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
  }, [refetch, station]);

  /**
   * Shows the move at once, then saves it. If the save fails, the card goes back to how it was
   * and the board says so; it never pretends an order moved when it didn't.
   */
  const move = async (ticket: StationTicket, to: TicketStatus, why?: string) => {
    const before = tickets;
    setProblem(null);
    setSaving((current) => new Set([...current, ticket.id]));
    setTickets((current) =>
      to === "preparing"
        ? current.map((item) => (item.id === ticket.id ? { ...item, status: "preparing" } : item))
        : current.filter((item) => item.id !== ticket.id),
    );
    try {
      const response = await fetch(`/api/${station}/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stationOrderId: ticket.id, from: ticket.status, to, reason: why }),
      });
      if (response.status === 403) {
        setSignedOut(true);
        return;
      }
      if (!response.ok) throw new Error("not saved");
    } catch {
      setTickets(before);
      setProblem(`Table ${ticket.table.number} didn’t update. Check the connection and try again.`);
    }
    setSaving((current) => new Set([...current].filter((id) => id !== ticket.id)));
    void refetch();
  };

  const confirmCancel = () => {
    const why = reason.trim();
    if (!why) {
      setReasonError("Say why, so the guests can be told.");
      return;
    }
    const ticket = cancelling;
    setCancelling(null);
    if (ticket) void move(ticket, "cancelled", why);
  };

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
    <section aria-labelledby={headings[station]} className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 id={headings[station]} className="font-display text-3xl leading-tight md:text-4xl">
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

      {problem ? (
        <p
          role="alert"
          className="rounded-md bg-danger-subtle p-4 text-lg text-danger-subtle-foreground"
        >
          {problem}
        </p>
      ) : null}

      {tickets.length === 0 ? (
        <p className="text-lg leading-relaxed text-muted-foreground">
          New orders appear here, oldest first.
        </p>
      ) : (
        <ol className="grid gap-6 md:grid-cols-2 xl:grid-cols-3" aria-label="Orders, oldest first">
          {tickets.map((ticket) => (
            <li key={ticket.id}>
              <TicketCard
                ticket={ticket}
                now={now}
                isNew={flashing.has(ticket.id)}
                busy={saving.has(ticket.id)}
                onMove={(to) => void move(ticket, to)}
                onCancel={() => {
                  setReason("");
                  setReasonError(null);
                  setCancelling(ticket);
                }}
              />
            </li>
          ))}
        </ol>
      )}

      {recent.length > 0 ? (
        <details className="rounded-lg border border-border bg-surface p-4 text-lg">
          <summary className="flex min-h-11 cursor-pointer items-center font-medium">
            Recently done ({recent.length})
          </summary>
          <ul className="mt-4 flex flex-col gap-3">
            {recent.map((item) => (
              <li key={item.id} className="leading-relaxed">
                <span className="font-semibold">Table {item.table.number}</span>
                {" · "}
                {item.status === "served" ? "Served" : "Cancelled"}{" "}
                <time dateTime={item.at}>{ticketAge(item.at, now).toLowerCase()}</time>
                {item.items.length > 0
                  ? ` · ${item.items.map((line) => `${line.quantity} × ${line.name}`).join(", ")}`
                  : null}
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <Sheet
        open={cancelling !== null}
        onOpenChange={(open) => {
          if (!open) setCancelling(null);
        }}
        title={cancelling ? `Cancel table ${cancelling.table.number}’s order?` : "Cancel order?"}
        description="The order leaves the board. Add a short reason for the record."
      >
        <form
          className="flex flex-col gap-6"
          onSubmit={(event) => {
            event.preventDefault();
            confirmCancel();
          }}
        >
          <Textarea
            label="Reason"
            rows={3}
            maxLength={MAX_CANCEL_REASON}
            value={reason}
            error={reasonError ?? undefined}
            onChange={(event) => {
              setReason(event.target.value);
              setReasonError(null);
            }}
          />
          <div className="flex flex-wrap gap-4">
            <Button type="submit" variant="danger" size="lg">
              Cancel order
            </Button>
            <Button type="button" variant="secondary" size="lg" onClick={() => setCancelling(null)}>
              Keep order
            </Button>
          </div>
        </form>
      </Sheet>
    </section>
  );
}

const statusLabels = { received: "Waiting", preparing: "Preparing" } as const;

function TicketCard({
  ticket,
  now,
  isNew,
  busy,
  onMove,
  onCancel,
}: {
  ticket: StationTicket;
  now: number;
  isNew: boolean;
  busy: boolean;
  onMove: (to: TicketStatus) => void;
  onCancel: () => void;
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
        <p className="text-lg">
          <span className="sr-only">Status: </span>
          <span className="font-medium">{statusLabels[ticket.status]}</span>
        </p>
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
        {"dietary" in ticket && ticket.dietary.length > 0 ? (
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
        <div className="mt-2 flex flex-wrap gap-3">
          {ticket.status === "received" ? (
            <Button
              type="button"
              size="lg"
              variant="secondary"
              aria-label={`Start preparing table ${ticket.table.number}`}
              disabled={busy}
              onClick={() => onMove("preparing")}
            >
              Start preparing
            </Button>
          ) : null}
          <Button
            type="button"
            size="lg"
            aria-label={`Served table ${ticket.table.number}`}
            disabled={busy}
            onClick={() => onMove("served")}
          >
            Served
          </Button>
          <Button
            type="button"
            size="lg"
            variant="ghost"
            aria-label={`Cancel table ${ticket.table.number}`}
            disabled={busy}
            onClick={onCancel}
          >
            Cancel
          </Button>
        </div>
      </div>
    </Card>
  );
}
