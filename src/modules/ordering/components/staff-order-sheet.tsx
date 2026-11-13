"use client";

import { useRef, useState } from "react";
import { Button, Input, Sheet, Textarea } from "@/modules/shared/components/ui";
import type { MenuItem } from "../lib/menu";
import { ORDER_NOTE_MAX, orderCopy, orderResponseSchema } from "../lib/order";
import type { BoardStation } from "../lib/station-board";
import { newRequestId } from "../lib/submit-order";
import { MenuSections } from "./menu-sections";

type Outcome = { kind: "sent"; table: number } | { kind: "signed-out" };

/**
 * "New order" on a board (TICKET-079): a waiter takes a guest's order by voice when the guest's
 * phone can't connect. Same menu, caps and sold-out states as the guest page; the order is marked
 * staff-entered and skips only the table cooldown.
 */
export function StaffOrderSheet({
  station,
  menu,
  onDone,
}: {
  station: BoardStation;
  menu: readonly MenuItem[];
  onDone: (outcome: Outcome) => void;
}) {
  const [open, setOpen] = useState(false);
  const [table, setTable] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [tableError, setTableError] = useState<string | null>(null);
  // One id per order attempt, so a retried tap can't create a second order.
  const requestId = useRef<string | null>(null);
  const available = Object.fromEntries(menu.map((item) => [item.id, item.available]));
  const items = Object.entries(quantities)
    .filter(([, quantity]) => quantity > 0)
    .map(([menuItemId, quantity]) => ({ menuItemId, quantity }));

  const reset = () => {
    setTable("");
    setQuantities({});
    setNote("");
    setProblem(null);
    setTableError(null);
    requestId.current = null;
  };

  const send = async () => {
    const number = Number(table);
    if (!Number.isInteger(number) || number < 1) {
      setTableError("Enter the table number.");
      return;
    }
    if (items.length === 0) {
      setProblem(orderCopy.emptyCart);
      return;
    }
    setSending(true);
    setProblem(null);
    requestId.current ??= newRequestId();
    try {
      const response = await fetch(`/api/${station}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientRequestId: requestId.current,
          table: number,
          items,
          note: note.trim(),
        }),
      });
      if (response.status === 403) {
        setOpen(false);
        onDone({ kind: "signed-out" });
        return;
      }
      const parsed = orderResponseSchema.safeParse(await response.json().catch(() => null));
      if (
        parsed.success &&
        (parsed.data.status === "created" || parsed.data.status === "replayed")
      ) {
        setOpen(false);
        reset();
        onDone({ kind: "sent", table: number });
        return;
      }
      if (parsed.success && parsed.data.status === "rejected") {
        // A refusal is final for this attempt; the next tap is a new order.
        requestId.current = null;
        setProblem(orderCopy.rejected[parsed.data.reason]);
        return;
      }
      setProblem(orderCopy.failed);
    } catch {
      setProblem(orderCopy.failed);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        size="lg"
        onClick={() => {
          reset();
          setOpen(true);
        }}
      >
        New order
      </Button>
      <Sheet
        open={open}
        onOpenChange={(next) => {
          if (!sending) setOpen(next);
        }}
        className="text-lg [&_.text-base]:text-lg [&_.text-sm]:text-lg [&_.type-label]:text-lg [&_label]:text-lg"
        title="New order for a table"
        description="For a guest whose phone can't connect. It goes to the kitchen and bar like any order."
      >
        <form
          className="flex flex-col gap-6"
          onSubmit={(event) => {
            event.preventDefault();
            void send();
          }}
        >
          <Input
            label="Table number"
            inputMode="numeric"
            autoComplete="off"
            value={table}
            error={tableError ?? undefined}
            onChange={(event) => {
              setTable(event.target.value.replace(/\D/g, ""));
              setTableError(null);
            }}
          />
          <MenuSections
            items={menu}
            available={available}
            quantities={quantities}
            locked={sending}
            onQuantityChange={(id, quantity) =>
              setQuantities((current) => ({ ...current, [id]: quantity }))
            }
          />
          <Textarea
            label={orderCopy.noteLabel}
            hint={orderCopy.noteHint}
            rows={2}
            maxLength={ORDER_NOTE_MAX}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
          {problem ? (
            <p
              role="alert"
              className="rounded-md bg-danger-subtle p-4 text-lg text-danger-subtle-foreground"
            >
              {problem}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-4">
            <Button type="submit" size="lg" disabled={sending}>
              {sending ? orderCopy.sendingButton : orderCopy.send}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              disabled={sending}
              onClick={() => setOpen(false)}
            >
              Close
            </Button>
          </div>
        </form>
      </Sheet>
    </>
  );
}
