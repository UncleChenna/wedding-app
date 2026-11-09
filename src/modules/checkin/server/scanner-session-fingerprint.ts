import "server-only";
import { createHmac } from "node:crypto";
import { cookies } from "next/headers";
import { STAFF_SESSION_COOKIE, staffSigningKey } from "@/modules/shared/server/staff-cookies";

/** Opaque comparison identity only; this value cannot sign or authenticate a staff session. */
export async function scannerSessionFingerprint(): Promise<string | null> {
  const key = staffSigningKey();
  const token = (await cookies()).get(STAFF_SESSION_COOKIE)?.value;
  return key && token
    ? createHmac("sha256", key).update("wedding-scanner-shell-v1\0").update(token).digest("hex")
    : null;
}
