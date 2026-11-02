import { expect, it } from "vitest";
import { defaultEventSettings } from "@/modules/shared/lib/event-settings";
import { prepareSharingInvitation } from "../lib/sharing-invitation";
const settings = { ...defaultEventSettings, coupleNames: ["Jane", "Alex"] as [string, string] };
const row = { id: "one", token: "a".repeat(43), status: "sent", name: "Amina" };
it("uses the configured host and approved voice for a published household", () => {
  const result = prepareSharingInvitation(row, settings, "https://wedding.example/");
  expect(result.share?.url).toBe("https://wedding.example/i/" + row.token);
  expect(result.share?.message).toContain("Jane & Alex");
  expect(result.share?.message).toContain("Hi Amina");
  expect(result).not.toHaveProperty("token");
});
it.each(["draft", "revoked"])("never exposes a usable URL for %s", (status) => {
  const result = prepareSharingInvitation({ ...row, status }, settings, "https://wedding.example/");
  expect(result.share).toBeUndefined();
  expect(JSON.stringify(result)).not.toContain(row.token);
  expect(result.guidance).toBeTruthy();
});
it("keeps invalid message fields out of share actions", () => {
  expect(
    prepareSharingInvitation({ ...row, name: "{GuestName}" }, settings, "https://wedding.example/")
      .share,
  ).toBeUndefined();
});
