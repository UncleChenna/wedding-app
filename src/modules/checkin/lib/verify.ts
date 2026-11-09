import { verifyGatePass, type GatePassVerification, type GatePublicKey } from "./gate-token";

export type ScannerTokenVerification =
  GatePassVerification | { ok: false; reason: "session-expired" };

/**
 * The caller supplies its trusted staff-session/snapshot deadline (ADR 0020, 06:00
 * after the event). Format-1 passes have no independent expiry. A valid credential
 * does not grant admission: snapshot status, token version and allowance are checked next.
 */
export async function verifyScannerToken(
  token: string,
  keys: readonly GatePublicKey[],
  policy: { now: number; sessionExpiresAt: number },
): Promise<ScannerTokenVerification> {
  if (
    !Number.isFinite(policy.now) ||
    !Number.isFinite(policy.sessionExpiresAt) ||
    policy.now >= policy.sessionExpiresAt
  ) {
    return { ok: false, reason: "session-expired" };
  }
  return verifyGatePass(token, keys, { now: policy.now });
}
