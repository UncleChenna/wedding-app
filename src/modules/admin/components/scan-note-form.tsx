"use client";
import { useActionState, useState } from "react";
import { Button, Select } from "@/modules/shared/components/ui";
import { scanResolutionNotes } from "../lib/scan-log";
import { saveScanNoteAction } from "../server/scan-note-action";

async function submitNote(previous: { ok: boolean; message: string }, form: FormData) {
  try {
    return await saveScanNoteAction(previous, form);
  } catch {
    return { ok: false, message: "We couldn't confirm your note was saved. Please try again." };
  }
}

export function ScanNoteForm({ eventId, requestId }: { eventId: string; requestId: string }) {
  const [state, action, pending] = useActionState(submitNote, { ok: false, message: "" });
  // React resets uncontrolled action forms even for expected error return values.
  // Retain the selected resolution so a failed request can be retried unchanged.
  const [resolution, setResolution] = useState("");
  return (
    <form action={action} className="space-y-4 [&_label]:text-lg [&_select]:text-lg">
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="requestId" value={requestId} />
      <Select
        label="Resolution note"
        name="resolution"
        value={resolution}
        onChange={(event) => setResolution(event.target.value)}
        required
        disabled={pending}
      >
        <option value="" disabled>
          Choose a note
        </option>
        {Object.entries(scanResolutionNotes).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Select>
      <p className="text-muted-foreground">
        Use a predefined note to keep private guest details and credentials out of the log. Notes do
        not change entry counts.
      </p>
      <Button type="submit" size="lg" disabled={pending} aria-busy={pending}>
        {pending ? "Saving note…" : "Add note"}
      </Button>
      <p role={state.ok ? "status" : "alert"} aria-live="polite">
        {state.message}
      </p>
    </form>
  );
}
