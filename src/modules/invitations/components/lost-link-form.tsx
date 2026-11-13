"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button, CenteredPanel, Input, panelLinkClassName } from "@/modules/shared/components/ui";
import { requestInvitationLink } from "../server/lost-link-actions";

export function LostLinkForm() {
  const [result, action, pending] = useActionState(requestInvitationLink, null, "/lost-link");
  return (
    <CenteredPanel
      eyebrow="Your invitation"
      title="Let’s find your link"
      description="Leave your name and the phone number or email you shared with us. We’ll help you find your invitation."
      footer={
        <Link href="/invite" className={panelLinkClassName}>
          Back to invitations
        </Link>
      }
    >
      {result?.status !== "received" && (
        <form action={action} aria-busy={pending} className="space-y-6">
          <Input
            name="name"
            label="Your full name"
            autoComplete="name"
            required
            maxLength={200}
            defaultValue={result?.fields?.name ?? ""}
          />
          <Input
            name="contact"
            label="Phone number or email"
            autoComplete="off"
            required
            maxLength={254}
            defaultValue={result?.fields?.contact ?? ""}
            hint="For an international number, include the country code, such as +234."
          />
          <p className="text-base leading-relaxed text-muted-foreground">
            Only our wedding team can see your request. We’ll check the details before sharing a
            link.
          </p>
          <Button type="submit" size="lg" fullWidth disabled={pending}>
            {pending ? "Saving your request…" : "Request my link"}
          </Button>
        </form>
      )}
      <div role="status" className="mt-6 text-center text-lg leading-relaxed">
        {result?.message}
      </div>
    </CenteredPanel>
  );
}
