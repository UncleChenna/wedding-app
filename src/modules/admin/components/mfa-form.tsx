"use client";
import { appRoutes } from "@/modules/shared/lib/routes";
import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/modules/shared/components/ui/button";
import { Input } from "@/modules/shared/components/ui/input";
import { QrMark } from "@/modules/shared/components/ui/qr-mark";
import { CenteredPanel, panelLinkClassName } from "@/modules/shared/components/ui/centered-panel";
import { initialMfaState } from "../lib/mfa-state";
import { enrollMfaAction, verifyMfaAction } from "../server/mfa-actions";

export function MfaForm({ factorId }: { factorId?: string }) {
  const [enrollment, enroll, enrolling] = useActionState(enrollMfaAction, initialMfaState);
  const [verification, verify, verifying] = useActionState(verifyMfaAction, initialMfaState);
  const status = useRef<HTMLParagraphElement>(null);
  const setup = enrollment.status === "setup" ? enrollment.setup : undefined;
  const activeFactor = setup?.id ?? factorId;
  const finished = verification.status === "verified";
  const message = verification.message || enrollment.message;
  useEffect(() => {
    if (message) status.current?.focus();
  }, [enrollment, verification, message]);
  return (
    <CenteredPanel
      variant="staff"
      eyebrow="Wedding admin"
      title={factorId ? "One more step" : "Protect your account"}
      description={
        factorId
          ? "Enter the current code from your authenticator app."
          : "Add an authenticator app so only you can open the wedding admin."
      }
      footer={
        <>
          <Link href={appRoutes.adminSignOut.path} className={panelLinkClassName}>
            Sign out
          </Link>
          <Link href={appRoutes.home.path} className={panelLinkClassName}>
            Back to our day
          </Link>
        </>
      }
    >
      {setup && !finished && (
        <section aria-label="Authenticator setup" className="space-y-6 text-center">
          <QrMark
            geometry={setup.qr}
            label="Authenticator setup QR code"
            className="mx-auto max-w-64"
          />
          <p className="text-lg leading-relaxed">
            Scan this in your authenticator, or add this setup key manually. Keep it private.
          </p>
          <code data-testid="setup-key" className="block text-lg leading-relaxed break-all">
            {setup.secret}
          </code>
        </section>
      )}
      <p
        ref={status}
        tabIndex={-1}
        role="status"
        aria-label="Two-step status"
        className="mt-6 text-center text-lg leading-relaxed empty:hidden focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >
        {message}
      </p>
      {finished ? (
        <div className="mt-6 flex justify-center">
          <Link href={appRoutes.admin.path} className={panelLinkClassName}>
            Continue to admin
          </Link>
        </div>
      ) : activeFactor ? (
        <form
          action={verify}
          className="mt-6 flex flex-col gap-6 [&_input]:text-lg [&_label]:text-lg [&_p]:text-lg"
        >
          <input type="hidden" name="factorId" value={activeFactor} />
          <Input
            label="Authenticator code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            pattern="[0-9]{6}"
            minLength={6}
            maxLength={6}
            hint="Use the current six-digit code from your app."
          />
          <div>
            <Button type="submit" size="lg" fullWidth disabled={verifying} aria-busy={verifying}>
              {verifying ? "Checking…" : "Verify code"}
            </Button>
          </div>
        </form>
      ) : (
        <form action={enroll} className="mt-6">
          <Button type="submit" size="lg" fullWidth disabled={enrolling} aria-busy={enrolling}>
            {enrolling ? "Preparing…" : "Set up authenticator"}
          </Button>
        </form>
      )}
      <details className="mt-8 text-center text-lg leading-relaxed">
        <summary className="min-h-11 cursor-pointer py-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
          Lost your authenticator?
        </summary>
        <p className="mt-4">
          Contact the couple or your wedding administrator. They’ll verify your identity before
          arranging a reset. An email code alone cannot unlock admin access.
        </p>
      </details>
    </CenteredPanel>
  );
}
