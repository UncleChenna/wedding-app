import { expect, it } from "vitest";
import { reminderEligible, prepareReminder } from "../lib/reminders";
import { shareTrackingInputSchema } from "../lib/share-tracking";

it("includes only sent invitations without any RSVP", () => {
  for (const status of ["draft", "sent", "rsvp_yes", "rsvp_no", "revoked"])
    for (const hasRsvp of [false, true])
      expect(reminderEligible(status, hasRsvp)).toBe(status === "sent" && !hasRsvp);
});
it("uses the approved RSVP nudge and preserves the invitation URL", () => {
  const result = prepareReminder(
    { id: "id", name: "Ada", token: "a".repeat(43), tokenVersion: 2 },
    { coupleNames: ["Uchenna", "Adaora"], invitationVoice: "warm" },
    "https://wedding.example",
  );
  expect(result.share?.message).toBe(
    "Hi Ada, a gentle tap on the shoulder from Uchenna & Adaora. We're setting tables and menus and we'd hate to plan without you. It takes under a minute: https://wedding.example/i/" +
      "a".repeat(43),
  );
  expect(result.tracking?.expectedVersion).toBe(2);
});
it("validates reminder purpose and defaults old callers to invitation", () => {
  const input = {
    invitationId: "00000000-0000-4000-8000-000000000001",
    requestId: "00000000-0000-4000-8000-000000000002",
    expectedVersion: 1,
    channel: "copy",
  };
  expect(shareTrackingInputSchema.parse(input).purpose).toBe("invitation");
  expect(shareTrackingInputSchema.parse({ ...input, purpose: "reminder" }).purpose).toBe(
    "reminder",
  );
  expect(shareTrackingInputSchema.safeParse({ ...input, purpose: "delivered" }).success).toBe(
    false,
  );
});
