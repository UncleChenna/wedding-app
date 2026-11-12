import { z } from "zod";
import { scannerWorkerMessage } from "./scanner-worker-message";
export type OfflineRecordInput = {
  session: string;
  clientEventId: string;
  kind: "observation" | "admission";
  people: number;
  nameChecked: boolean;
} & ({ inputMethod: "qr"; qr: string } | { inputMethod: "manual"; invitationId: string });
const verdict = z.enum(["valid", "invalid", "already_used", "revoked", "not_rsvped"]);
const recordResponse = z.discriminatedUnion("state", [
  z.object({
    state: z.enum(["recorded", "duplicate"]),
    clientEventId: z.uuid(),
    result: verdict,
    people: z.int().min(0).max(50),
  }),
  z.object({ state: z.literal("refused"), result: verdict }),
  z.object({
    state: z.enum([
      "unavailable",
      "rejected",
      "too_many",
      "bad_count",
      "full",
      "refresh_required",
      "name_check_required",
    ]),
  }),
]);
export type OfflineRecordResponse = z.infer<typeof recordResponse>;
export async function recordOfflineAttempt(
  input: OfflineRecordInput,
): Promise<OfflineRecordResponse> {
  const parsed = recordResponse.safeParse(
    await scannerWorkerMessage("RECORD_OFFLINE_ATTEMPT", input.session, input),
  );
  if (!parsed.success) return { state: "unavailable" };
  if (
    (parsed.data.state === "recorded" || parsed.data.state === "duplicate") &&
    (parsed.data.clientEventId !== input.clientEventId ||
      parsed.data.people !== input.people ||
      (input.kind === "admission" && parsed.data.result !== "valid"))
  )
    return { state: "unavailable" };
  return parsed.data;
}
const count = z.int().min(0).max(10_000);
const queueStatus = z.object({
  state: z.literal("ready"),
  pending: count,
  rejected: count,
  otherOperator: count,
  conflicts: count,
  refreshRequired: z.boolean(),
});
export type OfflineQueueStatus = z.infer<typeof queueStatus>;
export async function readOfflineQueueStatus(session: string): Promise<OfflineQueueStatus | null> {
  const parsed = queueStatus.safeParse(await scannerWorkerMessage("OFFLINE_QUEUE_STATUS", session));
  return parsed.success ? parsed.data : null;
}
