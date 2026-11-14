"use server";
import "server-only";
import { createSupabaseServerClient } from "@/modules/shared/server/supabase/server";
import { serverEnv } from "@/modules/shared/server/env";
import { createLogger } from "@/modules/shared/lib/logger";
import { parseAdminEmails } from "../lib/admin-emails";
import type { MfaState } from "../lib/mfa-state";
import { enrollAdminTotp, verifyAdminTotp } from "./mfa-service";
import { localAuthenticatorCode, usesLocalSignInCode } from "@/modules/shared/server/local-sign-in";
const log = createLogger({ module: "admin-mfa" });
// These bootstrap actions accept an authenticated allowlisted AAL1 session so it can reach AAL2.
// They cannot read or mutate privileged wedding data.
export async function enrollMfaAction(): Promise<MfaState> {
  try {
    const client = await createSupabaseServerClient();
    return await enrollAdminTotp(client.auth, parseAdminEmails(serverEnv.ADMIN_EMAIL_ALLOWLIST));
  } catch {
    log.warn("authenticator setup unavailable");
    return { status: "error", message: "Setup is unavailable just now. Please try again." };
  }
}
export async function verifyMfaAction(_previous: MfaState, form: FormData): Promise<MfaState> {
  try {
    const client = await createSupabaseServerClient();
    const factorId = form.get("factorId");
    let code = form.get("code");
    // Local development only (TICKET-250). verifyAdminTotp still checks the factor is this admin's.
    if (
      typeof factorId === "string" &&
      /^[0-9a-f-]{36}$/i.test(factorId) &&
      (await usesLocalSignInCode(code))
    )
      code = (await localAuthenticatorCode(factorId)) ?? code;
    return await verifyAdminTotp(client.auth, parseAdminEmails(serverEnv.ADMIN_EMAIL_ALLOWLIST), {
      factorId,
      code,
    });
  } catch {
    log.warn("authenticator verification unavailable");
    return { status: "error", message: "Verification is unavailable just now. Please try again." };
  }
}
