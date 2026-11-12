import { z } from "zod";
import { decideAdmission } from "./admission";
import { verifyGatePass, type GatePublicKey } from "./gate-token";
import { signedPassToken } from "./signed-pass-url";
import type { ScanReadResult } from "./scan-read-result";

const count = z.number().int().min(0).max(2147483647);
/** Transient authorized reader projection. Persistence and freshness are owned by065. */
const rowSchema = z
  .strictObject({
    status: z.enum(["draft", "sent", "rsvp_yes", "rsvp_no", "revoked"]),
    tokenVersion: count.min(1),
    attending: z.boolean().nullable(),
    countAttending: count,
    primaryNames: z.array(z.string().min(1)),
    householdName: z.string().nullable(),
    tableNumber: count.min(1).nullable(),
    admittedSoFar: count,
    admissions: z.array(
      z.strictObject({
        people: count.min(1),
        timeLabel: z.string().min(1),
        staffLabel: z.string().min(1),
        deviceLabel: z.string().min(1),
      }),
    ),
  })
  .refine((row) => row.admittedSoFar <= row.countAttending);

/** Never loads a QR URL. Only verified invitation identity reaches the supplied reader. */
export async function resolveScanRead(
  qr: string,
  origin: string,
  keys: readonly GatePublicKey[],
  load: (invitationId: string) => Promise<unknown>,
): Promise<ScanReadResult> {
  const token = signedPassToken(qr, origin);
  if (!token) return { state: "invalid" };
  const verified = await verifyGatePass(token, keys, { now: Date.now() });
  if (!verified.ok) return { state: "invalid" };
  const input = await load(verified.payload.inv);
  return resolveGuestRead(input, verified.payload.ver);
}

/** Shared presentation decision; callers must authorize the identity before loading this row. */
export function resolveGuestRead(input: unknown, passVersion: number): ScanReadResult {
  if (input === null) return { state: "unknown" };
  const parsed = rowSchema.safeParse(input);
  if (!parsed.success) return { state: "unavailable" };
  const row = parsed.data;
  const decision = decideAdmission({
    invitation: row,
    passVersion,
    admittedSoFar: row.admittedSoFar,
  });
  if (decision.result !== "valid" && decision.result !== "already_used") {
    if (decision.result === "revoked" && row.status !== "revoked" && passVersion < row.tokenVersion)
      return { state: "replaced" };
    const refused = {
      invalid: "invalid",
      revoked: "revoked",
      not_rsvped: "not_rsvped",
      bad_count: "unavailable",
      too_many: "unavailable",
    } as const;
    return { state: refused[decision.result] };
  }
  return {
    state: decision.result,
    guest: {
      name: row.primaryNames.join(" & ") || row.householdName?.trim() || "Guest",
      partySize: row.countAttending,
      admittedSoFar: row.admittedSoFar,
      tableNumber: row.tableNumber,
      admissions: row.admissions,
    },
  };
}
