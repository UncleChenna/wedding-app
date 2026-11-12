import { z } from "zod";
import { scanNoteInput } from "@/modules/admin/lib/scan-log";
export const gateConflictsSchema = z.strictObject({
  session: z.string().regex(/^[a-f0-9]{64}$/),
  expiresAt: z.number().int().positive(),
  entries: z
    .array(
      z.strictObject({
        id: z.uuid(),
        household: z.string().max(500).nullable(),
        staff: z.string().max(500).nullable(),
        device: z.string().max(500).nullable(),
        reportedAt: z.iso.datetime(),
        receivedAt: z.iso.datetime(),
        reportedPeople: z.number().int().min(0).max(50),
        admittedPeople: z.number().int().min(0).max(50),
        resolution: scanNoteInput.shape.resolution.nullable(),
      }),
    )
    .max(25),
});
export type GateConflict = z.infer<typeof gateConflictsSchema>["entries"][number];
export type GateConflictsState =
  | { state: "ready"; entries: GateConflict[] }
  | { state: "loading" | "unavailable" | "denied"; entries?: never };
