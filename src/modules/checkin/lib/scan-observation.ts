import { z } from "zod";
import type { ScanReadResult } from "./scan-read-result";

export const observationInputSchema = z.strictObject({
  invitationId: z.uuid().nullable(),
  result: z.enum(["valid", "already_used", "invalid", "revoked", "not_rsvped"]),
  inputMethod: z.enum(["qr", "manual"]),
  reportedAt: z.date(),
});
export type ScanObservation = z.infer<typeof observationInputSchema>;

/** Technical failures are not guest verdicts. Unknown invitation identities share the invalid vocabulary. */
export function observationResult(
  state: ScanReadResult["state"],
): ScanObservation["result"] | null {
  switch (state) {
    case "valid":
    case "already_used":
    case "invalid":
    case "revoked":
    case "not_rsvped":
      return state;
    case "replaced":
      return "revoked";
    case "unknown":
      return "invalid";
    case "unavailable":
    case "session_expired":
      return null;
  }
}
