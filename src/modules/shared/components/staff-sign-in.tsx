"use client";

import { useActionState, useId } from "react";
import type { StaffRole } from "../server/staff-auth";
import type { StaffSignInState } from "../lib/staff-sign-in-state";
import { staffSignInAction } from "../server/staff-actions";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

const initial: StaffSignInState = { status: "idle", message: "" };

async function previewAction(): Promise<StaffSignInState> {
  return { status: "idle", message: "Preview only. Use your station page to sign in." };
}

export function StaffSignIn({ role, preview = false }: { role: StaffRole; preview?: boolean }) {
  const statusId = useId();
  const [state, action, pending] = useActionState(
    preview ? previewAction : staffSignInAction,
    initial,
  );
  return (
    <form
      action={action}
      className="flex w-full max-w-sm flex-col gap-6 text-left"
      aria-label="Staff sign-in"
    >
      <input type="hidden" name="role" value={role} />
      <div className="[&_input]:text-2xl [&_label]:text-lg">
        <Input
          label="Your six-digit PIN"
          name="pin"
          type="password"
          inputMode="numeric"
          autoComplete="off"
          pattern="[0-9]{6}"
          minLength={6}
          maxLength={6}
          required
          className="min-h-14 text-2xl tracking-widest"
          aria-describedby={statusId}
        />
      </div>
      <p
        id={statusId}
        role={pending || state.status !== "idle" ? "status" : undefined}
        aria-live="polite"
        className="min-h-24 text-lg leading-relaxed text-muted-foreground"
      >
        {pending
          ? "Checking your PIN…"
          : state.message || "Use the PIN your team lead shared with you."}
      </p>
      <Button type="submit" size="lg" fullWidth disabled={pending} aria-busy={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
