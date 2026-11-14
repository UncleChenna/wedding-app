"use client";
import { appRoutes } from "@/modules/shared/lib/routes";
import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/modules/shared/components/ui/button";
import { Input } from "@/modules/shared/components/ui/input";
import { CenteredPanel, panelLinkClassName } from "@/modules/shared/components/ui/centered-panel";
import { initialAdminAuthState } from "../lib/auth-state";
import { adminSignInAction, adminSignOutAction } from "../server/auth-actions";

export function AdminAuthForm({ signOut = false }: { signOut?: boolean }) {
  const [state, action, pending] = useActionState(
    signOut ? adminSignOutAction : adminSignInAction,
    initialAdminAuthState,
  );
  const message = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (state.message) message.current?.focus();
  }, [state]);
  const finished = state.status === "signed-in" || state.status === "signed-out";
  return (
    <CenteredPanel
      variant="staff"
      eyebrow="Wedding admin"
      title={signOut ? "Sign out" : "Welcome back"}
      description={
        signOut
          ? "Finish your session on this device."
          : "Use your invited email address to receive a sign-in code."
      }
      footer={
        <Link
          href={signOut && !finished ? appRoutes.admin.path : appRoutes.home.path}
          className={panelLinkClassName}
        >
          {signOut && !finished ? "Back to control room" : "Back to our day"}
        </Link>
      }
    >
      <form
        action={action}
        className="flex flex-col gap-6 [&_input]:text-lg [&_label]:text-lg [&_p]:text-lg [&_p]:leading-relaxed"
      >
        {!signOut && !finished && (
          <>
            <Input
              label="Email address"
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              defaultValue={state.email}
              readOnly={Boolean(state.email)}
            />
            {state.email && (
              <Input
                label="Sign-in code"
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                pattern="[0-9]{6,8}"
                minLength={6}
                maxLength={8}
                hint="Enter the code from your email."
              />
            )}
          </>
        )}
        <p
          ref={message}
          tabIndex={-1}
          role="status"
          aria-label="Account status"
          className="text-center text-lg leading-relaxed empty:hidden focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          {state.message}
        </p>
        {finished ? (
          <div className="flex flex-col items-center gap-4">
            <Link
              className={panelLinkClassName}
              href={
                state.status === "signed-in" ? appRoutes.admin.path : appRoutes.adminSignIn.path
              }
            >
              {state.status === "signed-in" ? "Continue to admin" : "Sign in again"}
            </Link>
            {state.status === "signed-in" && (
              <Link className={panelLinkClassName} href={appRoutes.adminSignOut.path}>
                Sign out
              </Link>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <Button
              type="submit"
              name="intent"
              value={state.email ? "verify" : "send"}
              size="lg"
              fullWidth
              disabled={pending}
              aria-busy={pending}
            >
              {pending
                ? "Please wait…"
                : signOut
                  ? "Sign out"
                  : state.email
                    ? "Verify code"
                    : "Send code"}
            </Button>
            {state.email && (
              <Button
                type="submit"
                name="intent"
                value="send"
                variant="secondary"
                size="lg"
                formNoValidate
                disabled={pending}
              >
                Send a new code
              </Button>
            )}
            {state.email && (
              <a
                className="inline-flex min-h-11 items-center justify-center text-lg text-primary underline underline-offset-4"
                href={appRoutes.adminSignIn.path}
              >
                Use another email
              </a>
            )}
          </div>
        )}
      </form>
    </CenteredPanel>
  );
}
