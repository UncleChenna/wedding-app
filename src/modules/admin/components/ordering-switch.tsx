"use client";
import { useActionState } from "react";
import { Button } from "@/modules/shared/components/ui";
import { orderingSwitchCopy, type OrderingSwitchState } from "../lib/ordering-switch";
import { setOrderingOpenAction } from "../server/ordering-switch";

/** Open or close guest ordering; the current state is always written out, never colour alone. */
export function OrderingSwitch({ open: initialOpen }: { open: boolean }) {
  const [state, action, pending] = useActionState<OrderingSwitchState, FormData>(
    setOrderingOpenAction,
    { status: "idle" },
  );
  const open = state.status === "saved" ? state.open : initialOpen;
  return (
    <section aria-labelledby="ordering-switch" className="mt-12 border-b border-border pb-12">
      <h2 id="ordering-switch" className="font-display text-3xl">
        {orderingSwitchCopy.heading}
      </h2>
      <p className="mt-3">{open ? orderingSwitchCopy.open : orderingSwitchCopy.closed}</p>
      <form action={action} className="mt-6">
        <input type="hidden" name="open" value={String(!open)} />
        <Button
          type="submit"
          variant={open ? "secondary" : "primary"}
          disabled={pending}
          aria-busy={pending}
        >
          {open ? orderingSwitchCopy.closeButton : orderingSwitchCopy.openButton}
        </Button>
      </form>
      <p role="status" className="mt-4">
        {state.status === "idle" ? "" : state.message}
      </p>
    </section>
  );
}
