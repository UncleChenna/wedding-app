"use client";
import { appRoutes } from "@/modules/shared/lib/routes";

import Link from "next/link";
import { useState } from "react";

import { Select, ToastProvider } from "@/modules/shared/components/ui";
import { themeStyle, type Theme } from "@/modules/theming";

import { InvitationLifecycleControls } from "./invitation-lifecycle-controls";
import {
  invitationLifecycleCommandSchema,
  planInvitationLifecycle,
  type LifecycleCurrent,
  type LifecycleFormState,
} from "../lib/invitation-lifecycle";
import { ShareMenu } from "./share-menu";

export function SharePreview({
  themes,
  initialTheme,
}: {
  themes: readonly Theme[];
  initialTheme: Theme;
}) {
  const [themeId, setThemeId] = useState(initialTheme.id);
  const [sample, setSample] = useState<LifecycleCurrent>({
    status: "rsvp_yes",
    tokenVersion: 3,
    attending: true,
  });
  async function previewLifecycleAction(
    _previous: LifecycleFormState,
    form: FormData,
  ): Promise<LifecycleFormState> {
    const parsed = invitationLifecycleCommandSchema.safeParse({
      invitationId: form.get("invitationId"),
      operation: form.get("operation"),
      expectedVersion: Number(form.get("expectedVersion")),
      expectedStatus: form.get("expectedStatus"),
      confirmation: form.get("confirmation"),
    });
    if (!parsed.success) return { status: "error", message: "Please check the sample invitation." };
    const result = planInvitationLifecycle(sample, parsed.data);
    if (!result.ok) return { status: "error", message: "The sample changed. Please try again." };
    setSample({ ...sample, status: result.status, tokenVersion: result.tokenVersion });
    return {
      status: "saved",
      message:
        parsed.data.operation === "revoke"
          ? "Sample invitation revoked. No real guest data changed."
          : "Sample link reissued. No real guest data changed.",
    };
  }
  const theme = themes.find((item) => item.id === themeId) ?? initialTheme;
  return (
    <div style={themeStyle(theme)} className="min-h-dvh bg-background text-foreground">
      <ToastProvider>
        <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-12 px-6 py-10 md:py-16">
          <nav
            className="flex flex-wrap items-end justify-between gap-6"
            aria-label="Preview controls"
          >
            <Link
              href={appRoutes.dev.path}
              className="inline-flex min-h-11 items-center text-lg text-primary underline underline-offset-4"
            >
              All previews
            </Link>
            <Select
              label="Preview theme"
              value={themeId}
              onChange={(event) => setThemeId(event.target.value)}
            >
              {themes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </nav>
          <header className="space-y-6">
            <p className="text-base tracking-widest text-muted-foreground uppercase">
              Sharing preview
            </p>
            <h1 className="font-display text-4xl leading-tight tracking-tight md:text-5xl">
              An invitation, ready to send
            </h1>
            <p className="max-w-prose text-lg leading-relaxed">
              Choose a familiar app, copy the link, or open your phone&apos;s sharing options.
            </p>
          </header>
          <section aria-labelledby="sample-guest" className="space-y-6 border-t border-border pt-8">
            <div className="space-y-3">
              <p className="text-base tracking-widest text-muted-foreground uppercase">
                Sample invitation
              </p>
              <h2 id="sample-guest" className="font-display text-3xl">
                Alex Morgan
              </h2>
              <p className="text-lg leading-relaxed">Uchenna &amp; Adaora · 19 December 2026</p>
            </div>
            <p className="max-w-prose text-lg leading-relaxed text-muted-foreground">
              This preview uses a sample contact and an example.com link. It does not update your
              guest list.
            </p>
            <ShareMenu
              invitation={{
                url: "https://example.com/i/sample-invitation",
                subject: "Uchenna & Adaora — you're invited",
                message: "We'd love to celebrate with you. Here's your invitation.",
                phone: "07700 900123",
                email: "guest@example.com",
              }}
            />
          </section>
          <section
            aria-labelledby="sample-lifecycle"
            className="space-y-6 border-t border-border pt-8"
          >
            <h2 id="sample-lifecycle" className="font-display text-3xl">
              Manage this sample invitation
            </h2>
            <p className="max-w-prose text-lg leading-relaxed">
              Try the confirmation steps for Alex Morgan. These sample controls do not change any
              real invitation.
            </p>
            <InvitationLifecycleControls
              invitationId="6f1c2a4e-8b3d-4c5a-9e7f-1a2b3c4d5e6f"
              name="Alex Morgan"
              status={sample.status}
              tokenVersion={sample.tokenVersion}
              submitAction={previewLifecycleAction}
            />
          </section>
        </main>
      </ToastProvider>
    </div>
  );
}
