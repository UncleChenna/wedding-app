import { z } from "zod";

export const alertHealthSchema = z.strictObject({
  state: z.enum(["disabled", "ready", "warning", "unavailable"]),
  lastAcceptedAt: z.iso.datetime({ offset: true }).nullable(),
  failures: z.int().min(0),
});
export type AlertHealth = z.infer<typeof alertHealthSchema>;

export function alertHealthText(health: AlertHealth): string {
  if (health.state === "disabled") return "WhatsApp alerts are off. Follow orders on this board.";
  if (health.state === "unavailable")
    return "Alert status is unavailable. Keep following this board.";
  if (health.state === "warning")
    return "Some WhatsApp alerts could not be confirmed. Keep following this board.";
  return health.lastAcceptedAt ? "Last alert recorded as sent" : "WhatsApp alerts are ready.";
}
