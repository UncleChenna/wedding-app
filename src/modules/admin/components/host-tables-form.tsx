"use client";
import { useActionState, useState } from "react";
import { Button, Input } from "@/modules/shared/components/ui";
import { hostTablesCopy, type HostTablesState } from "../lib/staff";
import { saveHostTablesAction } from "../server/staff-actions";

/** Which tables one table host looks after (TICKET-082). */
export function HostTablesForm({
  id,
  name,
  tables,
}: {
  id: string;
  name: string;
  tables: readonly number[];
}) {
  const [state, action, pending] = useActionState<HostTablesState, FormData>(saveHostTablesAction, {
    status: "idle",
  });
  // React resets the form after an action; remount with what was typed when it was refused.
  const [shown, setShown] = useState(state);
  const [round, setRound] = useState(0);
  if (state !== shown) {
    setShown(state);
    setRound(round + 1);
  }
  const value = state.status === "error" ? state.tables : tables.join(", ");
  return (
    <form action={action} noValidate className="space-y-3 [&_label]:text-base">
      <input type="hidden" name="id" value={id} />
      <div className="max-w-sm" key={`tables-${round}`}>
        <Input
          id={`host-tables-${id}`}
          name="tables"
          inputMode="numeric"
          autoComplete="off"
          label={hostTablesCopy.label}
          hint={hostTablesCopy.hint}
          defaultValue={value}
          error={state.status === "error" ? state.fieldMessage : undefined}
        />
      </div>
      <Button
        type="submit"
        variant="secondary"
        disabled={pending}
        aria-busy={pending}
        aria-label={`${hostTablesCopy.save}: ${name}`}
      >
        {pending ? hostTablesCopy.saving : hostTablesCopy.save}
      </Button>
      <p role="status" className="text-lg leading-relaxed">
        {state.status === "idle" ? "" : state.message}
      </p>
    </form>
  );
}
