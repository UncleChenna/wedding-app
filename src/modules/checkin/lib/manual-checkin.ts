import { z } from "zod";
import { scanReadResultSchema } from "./scan-read-result";
import { admissionResponseSchema } from "./online-admission";

export const manualAdmissionRequestSchema = z.strictObject({
  operation: z.literal("admit"),
  invitationId: z.uuid(),
  version: z.number().int().min(1).max(2147483647),
  clientEventId: z.uuid(),
  people: z.number().int().min(1).max(2147483647),
});
export type ManualAdmissionRequest = z.infer<typeof manualAdmissionRequestSchema>;
export const manualReadRequestSchema = z.strictObject({
  operation: z.literal("read"),
  invitationId: z.uuid(),
});
export type ManualReadRequest = z.infer<typeof manualReadRequestSchema>;
export const manualRequestSchema = z.discriminatedUnion("operation", [
  z.strictObject({
    operation: z.literal("search"),
    query: z
      .string()
      .trim()
      .min(2)
      .max(200)
      .regex(/^[^\p{Cc}\p{Cf}]+$/u),
  }),
  manualReadRequestSchema,
  manualAdmissionRequestSchema,
]);
export const manualMatchesSchema = z.strictObject({
  state: z.literal("matches"),
  matches: z
    .array(
      z.strictObject({
        invitationId: z.uuid(),
        name: z.string().min(1).max(512),
        matchedName: z.string().min(1).max(512),
      }),
    )
    .max(10),
  hasMore: z.boolean(),
});
export const manualSelectionSchema = z.strictObject({
  state: z.literal("selection"),
  invitationId: z.uuid(),
  version: z.number().int().min(1).max(2147483647),
  result: scanReadResultSchema,
});
export type ManualSelection = z.infer<typeof manualSelectionSchema>;
export const manualResponseSchema = z.union([
  manualMatchesSchema,
  manualSelectionSchema,
  admissionResponseSchema,
]);
