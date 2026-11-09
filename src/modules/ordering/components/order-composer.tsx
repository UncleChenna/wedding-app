"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActionBar, Button, Textarea } from "@/modules/shared/components/ui";
import { menuCopy, type MenuItem } from "../lib/menu";
import { cooldownMessage, ORDER_NOTE_MAX, orderCopy } from "../lib/order";
import { splitByStation, type Station } from "../lib/stations";
import { newRequestId, submitOrder, type SubmitDeps } from "../lib/submit-order";
import { MenuSections } from "./menu-sections";
import { useMenuAvailability } from "./use-menu-availability";

type Line = { id: string; name: string; quantity: number; station: Station };
type Phase =
  | { kind: "editing"; notice?: string }
  | { kind: "sending"; attempt: number }
  | { kind: "failed"; limited?: true }
  | { kind: "sent"; lines: Line[]; note: string };

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function OrderComposer({
  items,
  table,
  pollIntervalMs,
  deps,
  initialOpen = true,
}: {
  items: MenuItem[];
  table: number;
  pollIntervalMs?: number;
  /** Whether guest ordering was open at render (ORD-7). */
  initialOpen?: boolean;
  /** Test seam; the page uses the browser's fetch and real timers. */
  deps?: Partial<SubmitDeps>;
}) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [note, setNote] = useState("");
  const [phase, setPhase] = useState<Phase>({ kind: "editing" });
  const [retryAt, setRetryAt] = useState(0);
  const [waitSeconds, setWaitSeconds] = useState(0);
  // One id per submission. Automatic retries and "Try again" reuse it; any edit starts afresh.
  const requestId = useRef<string | null>(null);
  const sentHeading = useRef<HTMLHeadingElement>(null);

  const dropItems = useCallback((ids: string[]) => {
    requestId.current = null;
    setQuantities((current) => {
      const kept = { ...current };
      for (const id of ids) delete kept[id];
      return kept;
    });
  }, []);
  const { available, open, announcement, markSoldOut, markClosed } = useMenuAvailability(items, {
    pollIntervalMs,
    onSoldOut: dropItems,
    initialOpen,
  });

  useEffect(() => {
    if (phase.kind === "sent") sentHeading.current?.focus();
  }, [phase.kind]);

  useEffect(() => {
    if (!retryAt) return;
    const update = () => {
      const seconds = Math.max(0, Math.ceil((retryAt - Date.now()) / 1000));
      setWaitSeconds(seconds);
      if (!seconds) setRetryAt(0);
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [retryAt]);

  const lines: Line[] = items
    .filter((item) => available[item.id] && (quantities[item.id] ?? 0) > 0)
    .map((item) => ({
      id: item.id,
      name: item.name,
      quantity: quantities[item.id] ?? 0,
      station: item.station,
    }));
  const sending = phase.kind === "sending";

  function edit(update: () => void) {
    requestId.current = null;
    if (phase.kind === "failed" || (phase.kind === "editing" && phase.notice))
      setPhase({ kind: "editing" });
    update();
  }

  async function send() {
    if (sending || lines.length === 0 || Date.now() < retryAt) return;
    requestId.current ??= newRequestId();
    const snapshot = lines;
    const trimmedNote = note.trim();
    setPhase({ kind: "sending", attempt: 1 });
    const outcome = await submitOrder(
      {
        clientRequestId: requestId.current,
        table,
        items: snapshot.map((line) => ({ menuItemId: line.id, quantity: line.quantity })),
        note: trimmedNote,
      },
      {
        fetch: deps?.fetch ?? ((...args) => fetch(...args)),
        sleep: deps?.sleep ?? sleep,
        onAttempt: (attempt) => setPhase({ kind: "sending", attempt }),
      },
    );
    if (outcome.status === "sent") {
      requestId.current = null;
      setPhase({ kind: "sent", lines: snapshot, note: trimmedNote });
      return;
    }
    if (outcome.status === "failed") {
      setPhase({ kind: "failed" });
      return;
    }
    if (outcome.status === "limited") {
      setWaitSeconds(outcome.retryAfterSeconds);
      setRetryAt(Date.now() + outcome.retryAfterSeconds * 1000);
      setPhase({ kind: "failed", limited: true });
      return;
    }
    requestId.current = null;
    const { reason, itemIds = [], retryAfterSeconds } = outcome.result;
    if (reason === "sold-out") markSoldOut(itemIds);
    // Closed while the page still showed it open: switch to the closed view, keeping the choices.
    if (reason === "closed") markClosed();
    setPhase({
      kind: "editing",
      notice:
        reason === "cooldown" && retryAfterSeconds
          ? cooldownMessage(retryAfterSeconds)
          : orderCopy.rejected[reason],
    });
  }

  if (phase.kind === "sent")
    return (
      <section aria-labelledby="order-sent">
        <h3
          id="order-sent"
          ref={sentHeading}
          tabIndex={-1}
          className="font-display text-3xl leading-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          {orderCopy.sent}
        </h3>
        {/* Kitchen and bar prepare their parts separately; the guest sees both in one place. */}
        {splitByStation(phase.lines).map((group) => (
          <div key={group.station} className="mt-8">
            <h4 id={`order-sent-${group.station}`} className="type-label text-primary">
              {group.label}
            </h4>
            <ul aria-labelledby={`order-sent-${group.station}`} className="mt-4 space-y-4">
              {group.items.map((line) => (
                <li
                  key={line.id}
                  className="flex justify-between gap-6 border-b border-border pb-4 text-lg"
                >
                  <span className="min-w-0 wrap-anywhere">{line.name}</span>
                  <span className="shrink-0 whitespace-nowrap">× {line.quantity}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {phase.note && (
          <p className="mt-6 text-base leading-relaxed wrap-anywhere">Your note: {phase.note}</p>
        )}
        <div className="mt-8">
          <Button
            onClick={() => {
              setQuantities({});
              setNote("");
              setPhase({ kind: "editing" });
            }}
          >
            {orderCopy.another}
          </Button>
        </div>
      </section>
    );

  if (!open)
    return (
      <section aria-labelledby="order-closed">
        <p role="status" className="sr-only">
          {announcement}
        </p>
        <h3 id="order-closed" className="font-display text-3xl leading-tight">
          {menuCopy.closedHeading}
        </h3>
        <p className="mt-6 max-w-prose text-lg leading-relaxed">{menuCopy.closed}</p>
      </section>
    );

  const count = lines.reduce((total, line) => total + line.quantity, 0);
  const status =
    waitSeconds > 0
      ? `Please wait ${waitSeconds} ${waitSeconds === 1 ? "second" : "seconds"} before trying again. Your choices are still here.`
      : phase.kind === "sending"
        ? phase.attempt > 1
          ? orderCopy.slow
          : orderCopy.sending
        : phase.kind === "failed"
          ? phase.limited
            ? "You can try again now. Your choices are still here."
            : orderCopy.failed
          : (phase.notice ??
            (count === 0
              ? orderCopy.emptyCart
              : `${count} ${count === 1 ? "item" : "items"} in your order.`));

  return (
    <div>
      <p role="status" className="sr-only">
        {announcement}
      </p>
      <MenuSections
        items={items}
        available={available}
        quantities={quantities}
        locked={sending}
        onQuantityChange={(id, quantity) =>
          edit(() => setQuantities((current) => ({ ...current, [id]: quantity })))
        }
      />
      <div className="mt-12">
        <Textarea
          id="order-note"
          label={orderCopy.noteLabel}
          hint={orderCopy.noteHint}
          maxLength={ORDER_NOTE_MAX}
          rows={2}
          value={note}
          readOnly={sending}
          onChange={(event) => {
            const value = event.target.value;
            edit(() => setNote(value));
          }}
        />
      </div>
      <ActionBar status={status} className="mt-8">
        <Button
          size="lg"
          fullWidth
          disabled={sending || lines.length === 0 || waitSeconds > 0}
          aria-busy={sending}
          onClick={() => void send()}
        >
          {sending
            ? orderCopy.sendingButton
            : phase.kind === "failed"
              ? orderCopy.retry
              : orderCopy.send}
        </Button>
      </ActionBar>
    </div>
  );
}
