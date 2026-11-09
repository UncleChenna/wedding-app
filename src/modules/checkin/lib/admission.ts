/**
 * Gate admission rules (PRD CHK-2, CHK-3; TICKET-058). Pure and dependency-free, so the server
 * and the offline scanner run exactly the same decision. The database keeps the same bound
 * (`admission_counters_bounded`: admitted_people <= allowance) as a second line of defence.
 */

/** What the scanner or server holds for the invitation behind a pass. */
export type AdmissionInvitation = {
  status: "draft" | "sent" | "rsvp_yes" | "rsvp_no" | "revoked";
  tokenVersion: number;
  attending: boolean | null;
  countAttending: number;
};

export type AdmissionRequest = {
  invitation: AdmissionInvitation | null;
  /** The token version printed in the scanned pass. */
  passVersion: number;
  /** People already admitted on this invitation, from every device. */
  admittedSoFar: number;
  /** People entering now. Omitted means the whole remaining party. */
  requested?: number;
};

export type AdmissionDecision =
  | {
      result: "valid";
      admit: number;
      admittedAfter: number;
      remaining: number;
      /** True once the whole allowance has been admitted; later scans are "already used". */
      fullyUsed: boolean;
    }
  /** More people than are left, or not a whole number of people: nobody is admitted. */
  | { result: "too_many" | "bad_count"; admit: 0; remaining: number }
  | { result: "already_used" | "invalid" | "revoked" | "not_rsvped"; admit: 0; remaining: 0 };

const refused = (result: "already_used" | "invalid" | "revoked" | "not_rsvped") =>
  ({ result, admit: 0, remaining: 0 }) as const;

export function decideAdmission({
  invitation,
  passVersion,
  admittedSoFar,
  requested,
}: AdmissionRequest): AdmissionDecision {
  if (!invitation || invitation.status === "draft") return refused("invalid");
  if (invitation.status === "revoked") return refused("revoked");
  // An older version means the pass was replaced by a reissue: the old QR is revoked.
  if (passVersion < invitation.tokenVersion) return refused("revoked");
  if (passVersion > invitation.tokenVersion) return refused("invalid");
  if (
    invitation.status !== "rsvp_yes" ||
    invitation.attending !== true ||
    invitation.countAttending < 1
  ) {
    return refused("not_rsvped");
  }

  const allowance = invitation.countAttending;
  const admitted = Math.max(0, admittedSoFar);
  const remaining = Math.max(0, allowance - admitted);
  if (remaining === 0) return refused("already_used");

  const admit = requested ?? remaining;
  if (!Number.isInteger(admit) || admit < 1) return { result: "bad_count", admit: 0, remaining };
  if (admit > remaining) return { result: "too_many", admit: 0, remaining };

  const admittedAfter = admitted + admit;
  return {
    result: "valid",
    admit,
    admittedAfter,
    remaining: remaining - admit,
    fullyUsed: admittedAfter === allowance,
  };
}
