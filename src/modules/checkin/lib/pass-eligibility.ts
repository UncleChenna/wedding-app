import type { GatePassPayload } from "./gate-token";

/** What the server currently holds for a pass's invitation. */
export type StoredPass = {
  status: "draft" | "sent" | "rsvp_yes" | "rsvp_no" | "revoked";
  tokenVersion: number;
  attending: boolean | null;
  countAttending: number;
  householdName: string | null;
  primaryNames: string[];
  tableNumber: number | null;
};

/** Guest-safe pass details: no identifiers, tokens or contact details. */
export type PassView = {
  names: string[];
  householdName: string | null;
  partySize: number;
  tableNumber: number | null;
};

/**
 * Online pass state from current server data. This is the authority a connected page shows;
 * an offline scanner may hold older evidence and follows ADR 0020's stale-list rules instead.
 * It reports eligibility only, never whether the party has already been admitted.
 */
export type PassResolution =
  | { state: "valid"; pass: PassView }
  | { state: "replaced" | "revoked" | "not-attending" | "invalid" | "unavailable" };

export function passEligibility(
  payload: GatePassPayload,
  stored: StoredPass | null,
): PassResolution {
  if (!stored || stored.status === "draft") return { state: "invalid" };
  if (stored.status === "revoked") return { state: "revoked" };
  if (payload.ver < stored.tokenVersion) return { state: "replaced" };
  if (payload.ver > stored.tokenVersion) return { state: "invalid" };
  if (stored.status !== "rsvp_yes" || stored.attending !== true || stored.countAttending < 1) {
    return { state: "not-attending" };
  }
  return {
    state: "valid",
    pass: {
      names: stored.primaryNames,
      householdName: stored.householdName,
      partySize: stored.countAttending,
      tableNumber: stored.tableNumber,
    },
  };
}
