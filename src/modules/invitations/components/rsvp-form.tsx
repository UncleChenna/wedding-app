"use client";

import { invitationHref } from "@/modules/shared/lib/routes";
import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/modules/shared/components/ui/button";
import { invitationSiteCopy } from "../lib/copy";
import { respondToInvitation } from "../server/rsvp-actions";
import type { RsvpState } from "../lib/rsvp-state";

export function RsvpForm({
  token,
  attendance,
  open,
}: {
  token: string;
  attendance: "yes" | "no" | null;
  open: boolean;
}) {
  const initial: RsvpState = {
    status: attendance ?? "idle",
    message:
      attendance === "yes"
        ? invitationSiteCopy.confirmed
        : attendance === "no"
          ? invitationSiteCopy.declined
          : "",
  };
  const [state, action, pending] = useActionState(
    respondToInvitation,
    initial,
    invitationHref(token),
  );
  const status = useRef<HTMLParagraphElement>(null);
  const previous = useRef(state);
  useEffect(() => {
    if (state !== previous.current && state.message) status.current?.focus();
    previous.current = state;
  }, [state]);
  return (
    <section aria-labelledby="rsvp-heading" className="mt-12 border-t border-border pt-8">
      <h2 id="rsvp-heading" className="type-heading">
        Will you join us?
      </h2>
      <p
        ref={status}
        role="status"
        aria-label="Your reply"
        tabIndex={-1}
        className="mt-6 min-h-12 text-lg leading-relaxed focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >
        {state.message}
      </p>
      {open ? (
        <form
          action={action}
          className="mt-6 grid gap-4 pb-[env(safe-area-inset-bottom)] sm:grid-cols-2"
        >
          <input type="hidden" name="token" value={token} />
          <Button
            type="submit"
            name="attendance"
            value="yes"
            size="lg"
            fullWidth
            disabled={pending}
            aria-busy={pending}
          >
            {invitationSiteCopy.attendance.yes}
          </Button>
          <Button
            type="submit"
            name="attendance"
            value="no"
            variant="secondary"
            size="lg"
            fullWidth
            disabled={pending}
            aria-busy={pending}
          >
            {invitationSiteCopy.attendance.no}
          </Button>
          {pending && (
            <p className="text-base leading-relaxed text-muted-foreground sm:col-span-2">
              Saving your reply…
            </p>
          )}
        </form>
      ) : (
        <p className="mt-6 text-base leading-relaxed text-muted-foreground">
          Replies aren’t open just yet. Please check back soon.
        </p>
      )}
    </section>
  );
}
