import { parseGuestSnapshot, type GuestSnapshot } from "./guest-snapshot";
import type { ManualLookupRequest, ManualResponse } from "./manual-checkin";
import { searchGuestNames } from "./manual-search";
import { resolveGuestRead } from "./resolve-scan-read";

/** Read-only projection of an authorized worker response; never an admission receipt. */
export function resolveManualSnapshot(
  input: ManualLookupRequest,
  value: unknown,
  authority: Pick<GuestSnapshot, "session" | "expiresAt">,
): ManualResponse {
  const snapshot = parseGuestSnapshot(value);
  if (!snapshot) return { state: "unavailable" };
  const deadline = Math.min(snapshot.expiresAt, authority.expiresAt);
  if (
    snapshot.session !== authority.session ||
    !Number.isSafeInteger(deadline) ||
    deadline <= Date.now()
  )
    return { state: "session_expired" };
  if (input.operation === "search")
    return { state: "matches", ...searchGuestNames(snapshot.invitations, input.query) };
  const row = snapshot.invitations.find(
    (candidate) => candidate.invitationId === input.invitationId,
  );
  if (!row) return { state: "invalid" };
  return {
    state: "selection",
    invitationId: row.invitationId,
    version: row.tokenVersion,
    result: resolveGuestRead(
      {
        status: row.status,
        tokenVersion: row.tokenVersion,
        attending: row.attending,
        countAttending: row.partySize,
        admittedSoFar: row.admittedSoFar,
        primaryNames: [],
        householdName: row.name,
        tableNumber: row.tableNumber,
        admissions: [],
      },
      row.tokenVersion,
    ),
  };
}
