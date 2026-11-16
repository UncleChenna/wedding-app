"use server";
import "server-only";
import { createSupabaseServerClient } from "@/modules/shared/server/supabase/server";
import { serverEnv } from "@/modules/shared/server/env";
import { createLogger } from "@/modules/shared/lib/logger";
import { parseAdminEmails } from "../lib/admin-emails";
import type { AdminAuthState } from "../lib/auth-state";
import { requestAdminCode, verifyAdminCode, signOutAdmin } from "./auth-service";
import {
  localEmailCode,
  localSignInFailed,
  usesLocalSignInCode,
} from "@/modules/shared/server/local-sign-in";
const log = createLogger({ module: "admin-auth" });
export async function adminSignInAction(
  _previous: AdminAuthState,
  form: FormData,
): Promise<AdminAuthState> {
  let local = false;
  try {
    const allowed = parseAdminEmails(serverEnv.ADMIN_EMAIL_ALLOWLIST);
    const client = await createSupabaseServerClient();
    if (form.get("intent") === "verify") {
      // Local development only (TICKET-250): swap the shared code for a real one from local Auth.
      const typed = form.get("code");
      const email = String(form.get("email") ?? "")
        .trim()
        .toLowerCase();
      local = (await usesLocalSignInCode(typed)) && Boolean(email);
      const swapped = local ? await localEmailCode(email) : null;
      const result = await verifyAdminCode(
        form.get("email"),
        swapped ?? typed,
        allowed,
        client.auth,
      );
      if (swapped && result.status === "error")
        localSignInFailed("email code", "local Supabase Auth rejected the code it issued");
      return result;
    }
    if (form.get("intent") === "send")
      return await requestAdminCode(form.get("email"), allowed, client.auth);
    return { status: "error", message: "Please try signing in again." };
  } catch {
    if (local) localSignInFailed("email code");
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
