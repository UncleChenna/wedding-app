import "server-only";
import { z } from "zod";
import { qrMatrix, qrPathData, qrViewBoxSize } from "@/modules/shared/lib/qr";
import { readAdminAccess, type AdminAccessPort } from "./admin-access";
import type { MfaState } from "../lib/mfa-state";

export interface AdminMfaPort extends AdminAccessPort {
  mfa: {
    enroll(input: { factorType: "totp"; friendlyName: string; issuer: string }): Promise<{
      data: { id: string; totp: { secret: string; uri: string } } | null;
      error: unknown;
    }>;
    unenroll(input: { factorId: string }): Promise<{ error: unknown }>;
    challengeAndVerify(input: { factorId: string; code: string }): Promise<{ error: unknown }>;
  };
}
const failure = (message: string): MfaState => ({ status: "error", message });
export async function enrollAdminTotp(
  auth: AdminMfaPort,
  allowed: readonly string[],
): Promise<MfaState> {
  const access = await readAdminAccess(auth, allowed);
  if (access.status !== "enroll")
    return failure("Please sign in and use your existing authenticator if you have one.");
  // Restart only this account's abandoned, unverified setup; never replace a verified factor at AAL1.
  for (const factor of access.factors) {
    if (factor.status !== "unverified") continue;
    const removed = await auth.mfa.unenroll({ factorId: factor.id });
    if (removed.error) return failure("We couldn’t restart setup. Please try again.");
  }
  const result = await auth.mfa.enroll({
    factorType: "totp",
    friendlyName: "Wedding admin",
    issuer: "Uchenna and Adaora",
  });
  if (result.error || !result.data) return failure("We couldn’t start setup. Please try again.");
  const matrix = qrMatrix(result.data.totp.uri);
  return {
    status: "setup",
    message: "Scan the code or enter the setup key in your authenticator.",
    setup: {
      id: result.data.id,
      secret: result.data.totp.secret,
      qr: { modules: matrix.size, side: qrViewBoxSize(matrix), path: qrPathData(matrix) },
    },
  };
}
export async function verifyAdminTotp(
  auth: AdminMfaPort,
  allowed: readonly string[],
  input: unknown,
): Promise<MfaState> {
  const parsed = z
    .object({
      factorId: z.uuid(),
      code: z
        .string()
        .trim()
        .regex(/^\d{6}$/),
    })
    .strict()
    .safeParse(input);
  if (!parsed.success) return failure("Enter the six-digit code from your authenticator.");
  const access = await readAdminAccess(auth, allowed);
  if (access.status === "signed-out" || access.status === "denied")
    return failure("Please sign in again before continuing.");
  if (!access.factors.some((factor) => factor.id === parsed.data.factorId))
    return failure("This setup is no longer available. Please restart sign-in.");
  const result = await auth.mfa.challengeAndVerify(parsed.data);
  if (result.error)
    return failure("That code couldn’t be verified. Try the current code in your app.");
  const updated = await readAdminAccess(auth, allowed);
  if (updated.status !== "ready")
    return failure("Please sign in again to finish two-step verification.");
  return { status: "verified", message: "Two-step sign-in is complete." };
}
