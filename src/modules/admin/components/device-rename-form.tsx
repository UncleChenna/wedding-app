"use client";
import { useActionState, useState } from "react";
import { Button, Input } from "@/modules/shared/components/ui";
import { deviceCopy, type DeviceFormState } from "../lib/device";
import { renameDeviceAction } from "../server/device-actions";

export function DeviceRenameForm({ id, name: current }: { id: string; name: string }) {
  const [state, action, pending] = useActionState<DeviceFormState, FormData>(renameDeviceAction, {
    status: "idle",
  });
  // Controlled, so a refused rename keeps what was typed through React's form reset.
  const [name, setName] = useState(current);
  return (
    <form action={action} noValidate className="space-y-3 [&_label]:text-base">
      <input type="hidden" name="id" value={id} />
      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-0 flex-1 basis-64">
          <Input
            id={`device-${id}`}
            name="name"
            label="Device name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={60}
            error={state.status === "error" ? state.message : undefined}
          />
        </div>
        <Button
          type="submit"
          variant="secondary"
          disabled={pending}
          aria-busy={pending}
          aria-label={`${deviceCopy.rename}: ${current}`}
        >
          {pending ? deviceCopy.renaming : deviceCopy.rename}
        </Button>
      </div>
      <p role="status" className="text-lg leading-relaxed">
        {state.status === "saved" ? state.message : ""}
      </p>
    </form>
  );
}
