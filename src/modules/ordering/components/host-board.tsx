"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/modules/shared/components/ui/button";
import { Card } from "@/modules/shared/components/ui/card";
import {
  HOST_POLL_MS,
  hostBoardSchema,
  type HostBoard as Board,
  type HostTicket,
} from "../lib/host-board";
import { ticketAge } from "../lib/station-board";

const stationLabels = { kitchen: "Food", bar: "Drinks" } as const;
const statusLabels = { received: "Waiting", preparing: "Preparing" } as const;

/** Open orders for a host's tables. It refreshes every few seconds while the tab is visible. */
export function HostBoard({ initial }: { initial: Board }) {
  const [tickets, setTickets] = useState<HostTicket[]>(initial.tickets);
  const [saving, setSaving] = useState<ReadonlySet<string>>(new Set());
  const [problem, setProblem] = useState<string | null>(null);
  const [signedOut, setSignedOut] = useState(false);
  const [now, setNow] = useState(() => Date.parse(initial.generatedAt));

  const refetch = useCallback(async () => {
    try {
      const response = await fetch("/api/host/board", { cache: "no-store" });
      if (response.status === 403) {
        setSignedOut(true);
        return;
      }
      const parsed = hostBoardSchema.safeParse(response.ok ? await response.json() : null);
      if (!parsed.success) return;
      setTickets(parsed.data.tickets);
      setNow(Date.parse(parsed.data.generatedAt));
    } catch {
      // Offline for a moment: keep the last board and try again on the next tick.
    }
  }, []);

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") void refetch();
    };
    const timer = setInterval(tick, HOST_POLL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [refetch]);

  const serve = async (ticket: HostTicket) => {
    const before = tickets;
    setProblem(null);
    setSaving((current) => new Set([...current, ticket.id]));
    setTickets((current) => current.filter((item) => item.id !== ticket.id));
    try {
      const response = await fetch("/api/host/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stationOrderId: ticket.id, from: ticket.status }),
      });
      if (response.status === 403) {
        setSignedOut(true);
        return;
      }
      // Someone at the station already served or cancelled it: the refetch shows the truth.
      if (!response.ok && response.status !== 409 && response.status !== 404)
        throw new Error("not saved");
    } catch {
      setTickets(before);
      setProblem(`Table ${ticket.table.number} didn’t update. Check the connection and try again.`);
    }
    setSaving((current) => new Set([...current].filter((id) => id !== ticket.id)));
    void refetch();
  };

  if (signedOut) {
    return (
      <p role="alert" className="text-lg leading-relaxed">
        This device was signed out. Reload the page and sign in with your PIN.
      </p>
    );
  }

  return (
    <section aria-labelledby="host-orders" className="flex flex-col gap-6">
      <h2 id="host-orders" className="font-display text-3xl leading-tight md:text-4xl">
        {tickets.length === 0
          ? "Nothing to bring out"
          : `${tickets.length} ${tickets.length === 1 ? "order" : "orders"} for your tables`}
      </h2>
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
          New orders for your tables appear here, oldest first.
        </p>
      ) : (
        <ol className="grid gap-6 md:grid-cols-2" aria-label="Orders, oldest first">
          {tickets.map((ticket) => (
            <li key={ticket.id}>
              <Card className="h-full">
                <div className="flex flex-col gap-4 p-6 text-lg leading-relaxed">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
                    <h3 className="font-display text-4xl leading-tight">
                      Table {ticket.table.number}
                      {ticket.table.name ? (
                        <span className="block font-sans text-lg text-muted-foreground">
                          {ticket.table.name}
                        </span>
                      ) : null}
                    </h3>
                    <p className="flex flex-wrap items-baseline gap-x-3 font-medium">
                      <span className="tracking-widest uppercase">
                        {stationLabels[ticket.station]}
                      </span>
                      <time dateTime={ticket.createdAt}>{ticketAge(ticket.createdAt, now)}</time>
                    </p>
                  </div>
                  <p>
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
                      <span className="tracking-widest uppercase">Note</span>
                      <span className="block">{ticket.note}</span>
                    </p>
                  ) : null}
                  <Button
                    type="button"
                    size="lg"
                    aria-label={`Served table ${ticket.table.number}, ${stationLabels[ticket.station].toLowerCase()}`}
                    disabled={saving.has(ticket.id)}
                    onClick={() => void serve(ticket)}
                  >
                    Served
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
