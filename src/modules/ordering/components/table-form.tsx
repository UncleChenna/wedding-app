"use client";
import { useActionState, useEffect, useRef } from "react";
import { Button, Input } from "@/modules/shared/components/ui";
import { selectTableAction } from "../server/table-actions";
import type { TableFormState } from "../lib/table-selection";

export function TableForm({ value = "", notice }: { value?: string; notice?: string }) {
  const initial: TableFormState = { status: notice ? "error" : "idle", value, message: notice };
  const [state, action, pending] = useActionState(selectTableAction, initial, "/order?change=1");
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.status === "error")
      form.current?.querySelector<HTMLInputElement>("#order-table")?.focus();
  }, [state]);
  return (
    <form
      ref={form}
      action={action}
      noValidate
      className="[&_input]:min-h-16 [&_input]:text-3xl [&_label]:text-base [&_p]:text-base"
    >
      <Input
        id="order-table"
        name="table"
        label="Table number"
        inputMode="numeric"
        autoComplete="off"
        enterKeyHint="go"
        maxLength={10}
        defaultValue={state.value}
        readOnly={pending}
        hint="You'll find it on your table card."
        error={state.status === "error" ? state.message : undefined}
      />
      <Button
        type="submit"
        size="lg"
        fullWidth
        disabled={pending}
        aria-busy={pending}
        className="mt-8"
      >
        {pending ? "Checking…" : "Confirm table"}
      </Button>
    </form>
  );
}
