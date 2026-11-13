import { describe, expect, it } from "vitest";
import { pushSubscriptionSchema, staffPushMessage } from "../lib/staff-push";

const subscription = {
  endpoint: "https://fcm.googleapis.com/fcm/send/test-device",
  keys: { p256dh: `B${"A".repeat(86)}`, auth: "A".repeat(22) },
};

describe("staff push boundaries", () => {
  it("accepts bounded browser subscriptions from known push services", () => {
    expect(pushSubscriptionSchema.safeParse(subscription).success).toBe(true);
  });
  it.each([
    "not a URL",
    "http://fcm.googleapis.com/send/a",
    "https://127.0.0.1/private",
    "https://fcm.googleapis.com.attacker.example/send/a",
    "https://user:password@fcm.googleapis.com/send/a",
    "https://fcm.googleapis.com:8443/send/a",
    "https://web.push.apple.com.attacker.example/a",
  ])("refuses arbitrary outbound destinations: %s", (endpoint) => {
    expect(pushSubscriptionSchema.safeParse({ ...subscription, endpoint }).success).toBe(false);
  });
  it("rejects malformed keys and extra payload data", () => {
    expect(
      pushSubscriptionSchema.safeParse({ ...subscription, keys: { p256dh: "bad", auth: "bad" } })
        .success,
    ).toBe(false);
    expect(
      pushSubscriptionSchema.safeParse({ ...subscription, guestName: "Private" }).success,
    ).toBe(false);
  });
  it("has only generic station copy and a fixed station destination", () => {
    expect(staffPushMessage("kitchen")).toEqual({
      type: "station-order",
      station: "kitchen",
      title: "New kitchen orders",
      body: "Open the board to see the latest orders.",
      url: "/kitchen",
      tag: "wedding-kitchen-orders",
    });
  });
});
