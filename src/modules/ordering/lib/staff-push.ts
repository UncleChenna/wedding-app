import { z } from "zod";
import type { Station } from "./stations";

const pushHosts = new Set([
  "fcm.googleapis.com",
  "updates.push.services.mozilla.com",
  "web.push.apple.com",
]);

export const pushSubscriptionSchema = z.strictObject({
  endpoint: z
    .url()
    .max(2048)
    .refine((value) => {
      if (!URL.canParse(value)) return false;
      const url = new URL(value);
      return (
        url.protocol === "https:" &&
        pushHosts.has(url.hostname) &&
        !url.port &&
        !url.username &&
        !url.password &&
        !url.hash
      );
    }),
  keys: z.strictObject({
    p256dh: z.string().regex(/^B[A-Za-z0-9_-]{86}$/),
    auth: z.string().regex(/^[A-Za-z0-9_-]{22}$/),
  }),
});
export type StaffPushSubscription = z.infer<typeof pushSubscriptionSchema>;

/** Never include the outbox message: it can contain a guest's dietary note. */
export function staffPushMessage(station: Station) {
  return {
    type: "station-order" as const,
    station,
    title: `New ${station} orders`,
    body: "Open the board to see the latest orders.",
    url: `/${station}`,
    tag: `wedding-${station}-orders`,
  };
}
