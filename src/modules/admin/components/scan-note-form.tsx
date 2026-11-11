"use client";
import { useActionState, useState } from "react";
import { Button, Select } from "@/modules/shared/components/ui";
import { scanResolutionNotes } from "../lib/scan-log";
import { saveScanNoteAction } from "../server/scan-note-action";

type NoteFormState = {
  ok: boolean;
  message: string;
  requestId: string;
  uncertain: boolean;
  submittedResolution: string;
};
async function submitNote(previous: NoteFormState, form: FormData): Promise<NoteFormState> {
  const submittedResolution = String(form.get("resolution") ?? "");
  try {
    const result = await saveScanNoteAction({ ok: previous.ok, message: previous.message }, form);
    return {
      ...result,
      requestId: result.ok ? crypto.randomUUID() : previous.requestId,
      uncertain: !result.ok && result.uncertain === true,
      submittedResolution,
    };
  } catch {
    return {
      ok: false,
      message: "We couldn't confirm your note was saved. Please try again.",
      requestId: previous.requestId,
      uncertain: true,
      submittedResolution,
    };
  }
}

export function ScanNoteForm({ eventId, requestId }: { eventId: string; requestId: string }) {
  // A server refresh must not replace an uncertain request's idempotency key.
  // Rotate it only after a positive save acknowledgement, for the next note.
  const [state, action, pending] = useActionState(submitNote, {
    ok: false,
    message: "",
    requestId,
    uncertain: false,
    submittedResolution: "",
  });
  // React resets uncontrolled action forms even for expected error return values.
  // Retain the selected resolution so a failed request can be retried unchanged.
  const [resolution, setResolution] = useState("");
  return (
    <form action={action} className="space-y-4 [&_label]:text-lg [&_select]:text-lg">
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="requestId" value={state.requestId} />
      {state.uncertain && (
        <input type="hidden" name="resolution" value={state.submittedResolution} />
      )}
      <Select
        label="Resolution note"
        name="resolution"
        value={state.uncertain ? state.submittedResolution : resolution}
        onChange={(event) => setResolution(event.target.value)}
        required
        disabled={pending || state.uncertain}
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
      {state.uncertain && <p>Retry this same note before choosing another.</p>}
      <Button type="submit" size="lg" disabled={pending} aria-busy={pending}>
        {pending ? "Saving note…" : state.uncertain ? "Retry note" : "Add note"}
      </Button>
      <p role={state.ok ? "status" : "alert"} aria-live="polite">
        {state.message}
      </p>
    </form>
  );
}
