"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { Button, Sheet } from "@/modules/shared/components/ui";
import type { LifecycleFormState, LifecycleStatus } from "../lib/invitation-lifecycle";
import { changeInvitationLifecycleAction } from "../server/invitation-lifecycle-actions";

type Props = {
  invitationId: string;
  name: string;
  status: LifecycleStatus;
  tokenVersion: number;
  submitAction?: (previous: LifecycleFormState, data: FormData) => Promise<LifecycleFormState>;
};

export function InvitationLifecycleControls({
  invitationId,
  name,
  status,
  tokenVersion,
  submitAction = changeInvitationLifecycleAction,
}: Props) {
  const [operation, setOperation] = useState<"revoke" | "reissue" | null>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const restoreAfterRevoke = useRef(false);
  const [result, action, pending] = useActionState<LifecycleFormState, FormData>(
    async (previous, data) => {
      const next = await submitAction(previous, data);
      if (next.status === "saved") {
        restoreAfterRevoke.current = data.get("operation") === "revoke";
        setOperation(null);
      }
      return next;
    },
    { status: "idle" },
  );
  useEffect(() => {
    // Successful revocation removes the opener. Wait for updated props and the
    // closed sheet, then restore focus once to the surviving household action.
    if (restoreAfterRevoke.current && status === "revoked" && operation === null && !pending) {
      controlsRef.current?.querySelector<HTMLButtonElement>("[data-lifecycle-reissue]")?.focus();
      restoreAfterRevoke.current = false;
    }
  }, [operation, pending, result, status]);
  const revoking = operation === "revoke";
  return (
    <div
      ref={controlsRef}
      className="space-y-4"
      role="group"
      aria-label={`${name}: invitation controls`}
    >
      <div className="flex flex-wrap gap-4">
        <Button
          size="lg"
          variant="secondary"
          disabled={pending}
          onClick={() => setOperation("reissue")}
          aria-label={`Reissue link: ${name}`}
          data-lifecycle-reissue
        >
          Reissue link
        </Button>
        {status !== "revoked" && (
          <Button
            size="lg"
            variant="ghost"
            disabled={pending}
            onClick={() => setOperation("revoke")}
            aria-label={`Revoke invitation: ${name}`}
          >
            Revoke invitation
          </Button>
        )}
      </div>
      <p role="status" className="min-h-7 text-lg leading-relaxed">
        {pending
          ? "Updating invitation…"
          : operation === null && result.status !== "idle"
            ? result.message
            : ""}
      </p>
      <Sheet
        open={operation !== null}
        onOpenChange={(open) => {
          if (!open) setOperation(null);
        }}
        title={revoking ? "Revoke invitation?" : "Reissue invitation link?"}
      >
        <p className="text-lg leading-relaxed wrap-anywhere">{name}</p>
        <p className="text-lg leading-relaxed">
          {revoking
            ? "Their invitation link and pass will stop working online. Their saved reply will be kept."
            : "The old invitation link and pass will stop working online. Their saved reply will be kept, and the new link will be available in Sharing."}
        </p>
        <p className="text-lg leading-relaxed text-muted-foreground">
          Offline scanners will learn this change when they refresh. A disconnected device may still
          accept the old pass until then.
        </p>
        <form action={action} className="space-y-6">
          <input type="hidden" name="invitationId" value={invitationId} />
          <input type="hidden" name="operation" value={operation ?? ""} />
          <input type="hidden" name="expectedVersion" value={tokenVersion} />
          <input type="hidden" name="expectedStatus" value={status} />
          <input type="hidden" name="confirmation" value="confirm" />
          {result.status === "error" && (
            <p role="alert" className="text-lg leading-relaxed">
              {result.message}
            </p>
          )}
          <div className="flex flex-wrap gap-4">
            <Button
              type="submit"
              size="lg"
              variant={revoking ? "danger" : "primary"}
              disabled={pending}
              aria-busy={pending}
            >
              {pending ? "Updating…" : revoking ? "Revoke invitation" : "Create new link"}
            </Button>
            <Button size="lg" variant="secondary" onClick={() => setOperation(null)}>
              Cancel
            </Button>
          </div>
        </form>
      </Sheet>
    </div>
  );
}
