"use client";
import { useActionState, useState } from "react";
import { Button } from "@/modules/shared/components/ui/button";
import { Checkbox } from "@/modules/shared/components/ui/checkbox";
import { Input } from "@/modules/shared/components/ui/input";
import { closeEventFormAction } from "../server/event-closure-action";

export function EventClosureForm({
  eventDate,
  eligible,
}: {
  eventDate: string;
  eligible: boolean;
}) {
  const [result, action, pending] = useActionState(closeEventFormAction, null);
  const [confirmation, setConfirmation] = useState("");
  const [evidencePreserved, setEvidencePreserved] = useState(false);
  const closed = result?.status === "closed";
  return (
    <form action={action} aria-label="Close event" className="mt-6 max-w-prose">
      <input type="hidden" name="eventDate" value={eventDate} />
      <fieldset disabled={!eligible || pending || closed} className="space-y-6">
        <legend className="sr-only">Confirm event closure</legend>
        <Checkbox
          name="evidencePreserved"
          required
          checked={evidencePreserved}
          onChange={(event) => setEvidencePreserved(event.target.checked)}
          label="All scanners have synced, or their pending admission records have been safely exported."
          hint="Check every scanner, including the backup, before ending staff access."
        />
        <Input
          name="confirmation"
          label="Type CLOSE EVENT to confirm"
          pattern="CLOSE EVENT"
          required
          autoComplete="off"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
        />
        <Button type="submit" variant="danger" loading={pending}>
          Close the event
        </Button>
      </fieldset>
      <p role="status" className="mt-4 min-h-12">
        {closed
          ? "The event is closed. Staff access has ended and ordering is off. Your admission records are preserved."
          : (result?.message ?? "")}
      </p>
    </form>
  );
}
