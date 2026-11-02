import "server-only";
import { isAdminEmail } from "../lib/admin-emails";

export interface AdminFactor {
  id: string;
  factor_type: string;
  status: string;
}
export interface AdminAccessPort {
  getUser(): Promise<{
    data: { user: { id: string; email?: string; factors?: AdminFactor[] } | null };
    error: unknown;
  }>;
  getClaims(): Promise<{
    data: { claims: { sub?: string; aal?: unknown } } | null;
    error: unknown;
  }>;
}
export type AdminAccess =
  | { status: "signed-out" }
  | { status: "denied" }
  | { status: "enroll" | "challenge" | "ready"; userId: string; factors: AdminFactor[] };

/** Verify cookies cryptographically and consult live identity/factors before every protected operation. */
export async function readAdminAccess(
  auth: AdminAccessPort,
  allowed: readonly string[],
): Promise<AdminAccess> {
  const {
    data: { user },
    error,
  } = await auth.getUser();
  if (error || !user) return { status: "signed-out" };
  if (!isAdminEmail(user.email, allowed)) return { status: "denied" };
  const verified = await auth.getClaims();
  if (verified.error || !verified.data || verified.data.claims.sub !== user.id)
    return { status: "signed-out" };
  const factors = (user.factors ?? []).filter((factor) => factor.factor_type === "totp");
  const enrolled = factors.some((factor) => factor.status === "verified");
  const status = !enrolled ? "enroll" : verified.data.claims.aal === "aal2" ? "ready" : "challenge";
  return { status, userId: user.id, factors };
}

/** Privileged server actions must call this boundary themselves; a layout is not action authorization. */
export async function withAdminAccess<T>(
  auth: AdminAccessPort,
  allowed: readonly string[],
  operation: (userId: string) => Promise<T>,
): Promise<{ ok: true; value: T } | { ok: false; message: string }> {
  const access = await readAdminAccess(auth, allowed);
  if (access.status !== "ready")
    return { ok: false, message: "Please complete two-step sign-in first." };
  return { ok: true, value: await operation(access.userId) };
}
