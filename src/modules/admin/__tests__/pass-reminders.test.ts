import { expect, it } from "vitest";
import { preparePassReminder } from "../lib/pass-reminders";
import { renderInvitationMessages } from "@/modules/invitations/lib/messages";

it("uses approved day-before copy and retains the current household link and version", () => {
  const settings = {
    coupleNames: ["Uchenna", "Adaora"] as [string, string],
    invitationVoice: "warm" as const,
  };
  const url = "https://wedding.example/i/" + "a".repeat(43);
  const expected = renderInvitationMessages({ guestName: "Ada", link: url }, settings);
  if (!expected.ok) throw new Error("Invalid fixture");
  const result = preparePassReminder(
    { id: "household", name: "Ada", token: "a".repeat(43), tokenVersion: 3 },
    settings,
    "https://wedding.example",
  );
  expect(result.share?.message).toBe(expected.messages.dayBefore);
  expect(result.share?.message).not.toBe(expected.messages.rsvp);
  expect(result.share?.url).toBe(url);
  expect(result.tracking).toEqual({ invitationId: "household", expectedVersion: 3 });
  expect(result.status).toBe("rsvp_yes");
});
