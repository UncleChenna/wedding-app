import { parseGuestSnapshot, type GuestSnapshot } from "./guest-snapshot";
import { resolveScanRead } from "./resolve-scan-read";
import type { ScanReadResult } from "./scan-read-result";

/** Read-only: shared signature/eligibility rules, no admission receipt or queue mutation. */
export async function resolveSnapshotRead(
  qr: string,
  origin: string,
  input: unknown,
  authority: Pick<GuestSnapshot, "session" | "expiresAt">,
): Promise<ScanReadResult> {
  const snapshot = parseGuestSnapshot(input);
  if (!snapshot) return { state: "unavailable" };
  const expiresAt = Math.min(snapshot.expiresAt, authority.expiresAt);
  const expired = () =>
    snapshot.session !== authority.session ||
    !Number.isSafeInteger(expiresAt) ||
    expiresAt <= Date.now();
  if (expired()) return { state: "session_expired" };
  try {
    const result = await resolveScanRead(qr, origin, snapshot.keys, async (invitationId) => {
      const row = snapshot.invitations.find(
        (row) => row.invitationId.toLowerCase() === invitationId.toLowerCase(),
      );
      if (!row) return null;
      return {
        status: row.status,
        tokenVersion: row.tokenVersion,
        attending: row.attending,
        countAttending: row.partySize,
        admittedSoFar: row.admittedSoFar,
        primaryNames: [],
        householdName: row.name,
        tableNumber: row.tableNumber,
        admissions: [],
      };
    });
    return expired() ? { state: "session_expired" } : result;
  } catch {
    return { state: "unavailable" };
  }
}
