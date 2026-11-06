"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button, Input } from "@/modules/shared/components/ui";
import { requestInvitationLink } from "../server/lost-link-actions";

export function LostLinkForm() {
  const [result, action, pending] = useActionState(requestInvitationLink, null, "/lost-link");
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-6 py-16">
      <p className="text-base tracking-widest text-primary uppercase">Your invitation</p>
      <h1 className="mt-6 font-display text-5xl">Let’s find your link</h1>
      <p className="mt-6 text-lg leading-relaxed">
        Leave your name and the phone number or email you shared with us. We’ll help you find your
        invitation.
      </p>
      {result?.status !== "received" && (
        <form action={action} aria-busy={pending} className="mt-10 space-y-6">
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
          <Button type="submit" disabled={pending}>
            {pending ? "Saving your request…" : "Request my link"}
          </Button>
        </form>
      )}
      <div role="status" className="mt-6 text-lg leading-relaxed">
        {result?.message}
      </div>
      <Link
        href="/invite"
        className="mt-8 inline-flex min-h-11 items-center text-primary underline underline-offset-4"
      >
        Back to invitations
      </Link>
    </main>
  );
}
