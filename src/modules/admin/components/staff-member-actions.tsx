"use client";
import { useActionState } from "react";
import { Button } from "@/modules/shared/components/ui";
import { staffCopy, type PinState } from "../lib/staff";
import { issuePinAction, revokeStaffAction } from "../server/staff-actions";

/** Issue or reset a PIN (shown once, here only) and remove access, each with immediate feedback. */
export function StaffMemberActions({
  id,
  name,
  hasPin,
}: {
  id: string;
  name: string;
  hasPin: boolean;
}) {
  const [issued, issueAction, issuing] = useActionState<PinState, FormData>(issuePinAction, {
    status: "idle",
  });
  const [revoked, revokeAction, revoking] = useActionState<PinState, FormData>(revokeStaffAction, {
    status: "idle",
  });
  const message = [issued, revoked].find(
    (state) => state.status === "error" || state.status === "revoked",
  );
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <form action={issueAction}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="name" value={name} />
          <Button
            type="submit"
            variant={hasPin ? "secondary" : "primary"}
            disabled={issuing}
            aria-busy={issuing}
            aria-label={`${hasPin ? staffCopy.reset : staffCopy.issue}: ${name}`}
          >
            {hasPin ? staffCopy.reset : staffCopy.issue}
          </Button>
        </form>
        {hasPin && (
          <form action={revokeAction}>
            <input type="hidden" name="id" value={id} />
            <Button
              type="submit"
              variant="ghost"
              disabled={revoking}
              aria-busy={revoking}
              aria-label={`${staffCopy.revoke}: ${name}`}
            >
              {staffCopy.revoke}
            </Button>
          </form>
        )}
      </div>
      {issued.status === "issued" && (
        <div
          role="status"
          aria-label={staffCopy.issuedFor(name)}
          className="rounded-md border border-border bg-surface-muted p-6"
        >
          <p className="type-label text-primary">{staffCopy.issuedFor(name)}</p>
          <p
            className="font-mono mt-3 text-4xl tracking-[0.2em] tabular-nums"
            data-testid="issued-pin"
          >
            {issued.pin}
          </p>
          <p className="mt-3">{staffCopy.activeUntil(issued.until)}.</p>
          <p className="mt-2">{staffCopy.writeDown}</p>
        </div>
      )}
      <p role="status" className="text-lg leading-relaxed">
        {message && "message" in message ? message.message : ""}
      </p>
    </div>
  );
}
