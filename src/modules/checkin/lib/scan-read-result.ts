import { z } from "zod";

const count = z.number().int().min(0).max(2147483647);
const guest = z
  .strictObject({
    name: z.string().min(1),
    partySize: count.min(1),
    admittedSoFar: count,
    tableNumber: count.min(1).nullable(),
    admissions: z.array(
      z.strictObject({
        people: count.min(1),
        timeLabel: z.string().min(1),
        staffLabel: z.string().min(1),
        deviceLabel: z.string().min(1),
      }),
    ),
  })
  .refine((value) => value.admittedSoFar <= value.partySize);

/** A transient response, not a persistent/offline snapshot or an admission receipt. */
export const scanReadResultSchema = z.discriminatedUnion("state", [
  z
    .strictObject({ state: z.literal("valid"), guest })
    .refine((value) => value.guest.admittedSoFar < value.guest.partySize),
  z
    .strictObject({ state: z.literal("already_used"), guest })
    .refine((value) => value.guest.admittedSoFar === value.guest.partySize),
  z.strictObject({
    state: z.enum([
      "invalid",
      "revoked",
      "replaced",
      "not_rsvped",
      "unknown",
      "unavailable",
      "session_expired",
    ]),
  }),
]);
export type ScanReadResult = z.infer<typeof scanReadResultSchema>;
