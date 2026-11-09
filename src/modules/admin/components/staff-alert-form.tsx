"use client";
import { useActionState, useState } from "react";
import { Button, Checkbox, Input } from "@/modules/shared/components/ui";
import { alertCopy, type AlertContactState } from "../lib/staff-alerts";
import { saveAlertContactAction } from "../server/staff-actions";

/** WhatsApp number and order-alert opt-in for one kitchen or bar person (TICKET-086). */
export function StaffAlertForm({
  id,
  name,
  number: savedNumber,
  optIn: savedOptIn,
}: {
  id: string;
  name: string;
  number: string | null;
  optIn: boolean;
}) {
  const [state, action, pending] = useActionState<AlertContactState, FormData>(
    saveAlertContactAction,
    { status: "idle" },
  );
  // React resets the form after every action, which unticks a box whose state didn't change.
  // Remounting the fields per result with the right defaults keeps what was typed on a refusal.
  const [shown, setShown] = useState(state);
  const [round, setRound] = useState(0);
  if (state !== shown) {
    setShown(state);
    setRound(round + 1);
  }
  const number = state.status === "error" ? state.number : (savedNumber ?? "");
  const optIn = state.status === "error" ? state.optIn : savedOptIn;
  return (
    <form action={action} noValidate className="space-y-3 [&_label]:text-base">
      <input type="hidden" name="id" value={id} />
      <div className="max-w-sm" key={`number-${round}`}>
        <Input
          id={`alert-number-${id}`}
          name="number"
          type="tel"
          inputMode="tel"
          autoComplete="off"
          label={alertCopy.number}
          hint={alertCopy.numberHint}
          defaultValue={number}
          error={state.status === "error" ? state.fieldMessage : undefined}
        />
      </div>
      <Checkbox
        key={`opt-in-${round}`}
        id={`alert-opt-in-${id}`}
        name="optIn"
        label={alertCopy.optIn}
        defaultChecked={optIn}
      />
      <Button
        type="submit"
        variant="secondary"
        disabled={pending}
        aria-busy={pending}
        aria-label={`${alertCopy.save}: ${name}'s alerts`}
      >
        {pending ? alertCopy.saving : alertCopy.save}
      </Button>
      <p role="status" className="text-lg leading-relaxed">
        {state.status === "idle" ? "" : state.message}
      </p>
    </form>
  );
}
