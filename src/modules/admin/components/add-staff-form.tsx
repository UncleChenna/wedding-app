"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { Button, Input, Select } from "@/modules/shared/components/ui";
import { STAFF_ROLE_OPTIONS, staffCopy, type StaffFormState } from "../lib/staff";
import { addStaffAction } from "../server/staff-actions";

export function AddStaffForm() {
  const [state, action, pending] = useActionState<StaffFormState, FormData>(addStaffAction, {
    status: "idle",
  });
  const form = useRef<HTMLFormElement>(null);
  // Controlled so a refused submit keeps the choice through React's form reset.
  const [role, setRole] = useState("");
  const [name, setName] = useState("");
  const [handled, setHandled] = useState(state);
  if (handled !== state) {
    setHandled(state);
    if (state.status === "saved") {
      setRole("");
      setName("");
    }
  }
  useEffect(() => {
    if (state.status === "error")
      form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [state]);
  const error = state.status === "error" ? state : null;
  return (
    <form ref={form} action={action} noValidate className="space-y-6 [&_label]:text-base">
      <div className="grid gap-6 sm:grid-cols-2">
        <Input
          id="staff-name"
          name="name"
          label="Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={80}
          required
          error={error?.field === "name" ? error.fieldMessage : undefined}
        />
        <Select
          id="staff-role"
          name="role"
          label="Works at"
          value={role}
          onChange={(event) => setRole(event.target.value)}
          required
          error={error?.field === "role" ? error.fieldMessage : undefined}
        >
          <option value="" disabled>
            Choose the gate, kitchen or bar
          </option>
          {STAFF_ROLE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending} aria-busy={pending}>
          {pending ? staffCopy.adding : staffCopy.add}
        </Button>
        <p role="status" className="text-lg leading-relaxed">
          {state.status === "idle" ? "" : state.message}
        </p>
      </div>
    </form>
  );
}
