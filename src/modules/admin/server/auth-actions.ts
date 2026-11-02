"use server";
import "server-only";
import { createSupabaseServerClient } from "@/modules/shared/server/supabase/server";
import { serverEnv } from "@/modules/shared/server/env";
import { createLogger } from "@/modules/shared/lib/logger";
import { parseAdminEmails } from "../lib/admin-emails";
import type { AdminAuthState } from "../lib/auth-state";
import { requestAdminCode, verifyAdminCode, signOutAdmin } from "./auth-service";
const log = createLogger({ module: "admin-auth" });
export async function adminSignInAction(
  _previous: AdminAuthState,
  form: FormData,
): Promise<AdminAuthState> {
  try {
    const allowed = parseAdminEmails(serverEnv.ADMIN_EMAIL_ALLOWLIST);
    const client = await createSupabaseServerClient();
    if (form.get("intent") === "verify")
      return await verifyAdminCode(form.get("email"), form.get("code"), allowed, client.auth);
    if (form.get("intent") === "send")
      return await requestAdminCode(form.get("email"), allowed, client.auth);
    return { status: "error", message: "Please try signing in again." };
  } catch {
    log.warn("admin sign-in unavailable");
    return {
      status: "error",
      message: "Sign-in is unavailable just now. Please try again shortly.",
    };
  }
}
export async function adminSignOutAction(): Promise<AdminAuthState> {
  try {
    const client = await createSupabaseServerClient();
    return await signOutAdmin(client.auth);
  } catch {
    log.warn("admin sign-out unavailable");
    return { status: "error", message: "We couldn’t sign you out. Please try again." };
  }
}
