import "server-only";
import { generateRequestDetails } from "web-push";
import {
  pushSubscriptionSchema,
  staffPushMessage,
  type StaffPushSubscription,
} from "../lib/staff-push";
import type { Station } from "../lib/stations";
import { staffPushConfig } from "./staff-push-config";

export type PushResult = "sent" | "expired" | "failed";
export type StaffPushSender = (
  subscription: StaffPushSubscription,
  station: Station,
) => Promise<PushResult>;

/** Encrypt with the maintained Web Push library; bound the entire network request, not only inactivity. */
export const sendStaffPush: StaffPushSender = async (subscription, station) => {
  const parsed = pushSubscriptionSchema.safeParse(subscription);
  const config = staffPushConfig();
  if (!parsed.success || !config) return "failed";
  try {
    const details = generateRequestDetails(parsed.data, JSON.stringify(staffPushMessage(station)), {
      vapidDetails: config,
      TTL: 60,
      urgency: "high",
      topic: `wedding-${station}`,
    });
    const response = await fetch(parsed.data.endpoint, {
      method: "POST",
      headers: details.headers,
      body: details.body ? new Uint8Array(details.body) : undefined,
      redirect: "error",
      signal: AbortSignal.timeout(3_000),
      cache: "no-store",
    });
    await response.body?.cancel();
    if (response.status === 404 || response.status === 410) return "expired";
    return response.ok ? "sent" : "failed";
  } catch {
    // Endpoint URLs, encryption keys, request headers and response bodies must not be logged.
    return "failed";
  }
};
