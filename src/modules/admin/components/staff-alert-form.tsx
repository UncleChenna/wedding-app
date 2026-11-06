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
  // Controlled, so a refused save keeps what was typed through React's form reset.
  const [number, setNumber] = useState(savedNumber ?? "");
  const [optIn, setOptIn] = useState(savedOptIn);
  const [shown, setShown] = useState(state);
  if (state !== shown) {
    setShown(state);
    if (state.status === "error") {
      setNumber(state.number);
      setOptIn(state.optIn);
    }
  }
  return (
    <form action={action} noValidate className="space-y-3 [&_label]:text-base">
      <input type="hidden" name="id" value={id} />
      <div className="max-w-sm">
        <Input
          id={`alert-number-${id}`}
          name="number"
          type="tel"
          inputMode="tel"
          autoComplete="off"
          label={alertCopy.number}
          hint={alertCopy.numberHint}
          value={number}
          onChange={(event) => setNumber(event.target.value)}
          error={state.status === "error" ? state.fieldMessage : undefined}
        />
      </div>
      <Checkbox
        id={`alert-opt-in-${id}`}
        name="optIn"
        label={alertCopy.optIn}
        checked={optIn}
        onChange={(event) => setOptIn(event.target.checked)}
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
