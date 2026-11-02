import { describe, expect, it } from "vitest";
import { defaultEventSettings } from "@/modules/shared/lib/event-settings";
import { renderInvitationMessages } from "../lib/messages";

const recipient = { guestName: "Amara", link: "https://example.test/i/abc" };
const settings = { ...defaultEventSettings, invitationVoice: "warm" };

describe("approved invitation messages", () => {
  it("uses the approved Warm default when no explicit voice is supplied", () => {
    expect(renderInvitationMessages(recipient, { coupleNames: settings.coupleNames })).toEqual(
      renderInvitationMessages(recipient, settings),
    );
  });
  it.each(["warm", "playful", "formal"])("fills every template for %s", (voice) => {
    const result = renderInvitationMessages(recipient, { ...settings, invitationVoice: voice });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.message);
    const messages = [
      result.messages.whatsapp,
      result.messages.email.subject,
      result.messages.email.body,
      result.messages.rsvp,
      result.messages.dayBefore,
    ];
    for (const text of messages) {
      expect(text).not.toMatch(/[{}]/);
    }
    for (const text of [
      result.messages.whatsapp,
      result.messages.email.body,
      result.messages.rsvp,
      result.messages.dayBefore,
    ])
      expect(text).toContain(recipient.link);
    for (const text of [
      result.messages.whatsapp,
      result.messages.email.subject,
      result.messages.rsvp,
      result.messages.dayBefore,
    ])
      expect(text).toContain("Amara");
    expect(result.messages.email.body).toBe(
      "Some days are written in the stars; ours is written in ink, and we'd love you to be part of it. Uchenna & Adaora are getting married. Open your personal invitation to RSVP, add your tag-alongs and choose your meals: https://example.test/i/abc. Save this email: the same link holds your entry pass.",
    );
    expect(result.messages.email.subject).toBe("A seat is waiting for you, Amara");
    expect(result.messages.rsvp).toBe(
      "Hi Amara, a gentle tap on the shoulder from Uchenna & Adaora. We're setting tables and menus and we'd hate to plan without you. It takes under a minute: https://example.test/i/abc",
    );
    expect(result.messages.dayBefore).toBe(
      "Tomorrow, Amara! Your entry pass is ready at https://example.test/i/abc. Bring your phone (a screenshot of your QR works too), your appetite and your best dance moves.",
    );
  });
  it("uses the selected voice without inventing alternative email or reminder wording", () => {
    const warm = renderInvitationMessages(recipient, settings);
    const formal = renderInvitationMessages(recipient, { ...settings, invitationVoice: "formal" });
    expect(warm.ok && formal.ok).toBe(true);
    if (!warm.ok || !formal.ok) throw new Error("valid fixtures rejected");
    expect(warm.messages.whatsapp).toMatch(/^Hi Amara, two hearts/);
    expect(formal.messages.whatsapp).toMatch(/^Dear Amara, together with their families/);
    expect(formal.messages.email).toEqual(warm.messages.email);
    expect(formal.messages.rsvp).toBe(warm.messages.rsvp);
  });
  it("preserves Unicode and replacement-looking characters literally", () => {
    const result = renderInvitationMessages(
      { ...recipient, guestName: "Adá $& $1" },
      { ...settings, coupleNames: ["Chénna", "Adaora"] },
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.messages.whatsapp).toContain("Hi Adá $& $1, two hearts");
  });
  it.each([
    { guestName: "" },
    { guestName: "{Link}" },
    { guestName: "A\nB" },
    { link: "javascript:alert(1)" },
    { link: "/i/abc" },
    { link: "https://user:pass@example.test/i/abc" },
    { guestName: "A".repeat(201) },
  ])("returns an expected error for invalid recipient %j", (patch) => {
    expect(renderInvitationMessages({ ...recipient, ...patch }, settings)).toEqual({
      ok: false,
      message: "Check the guest name, couple names, invitation link and message voice.",
    });
  });
  it.each([
    { invitationVoice: "unknown" },
    { coupleNames: ["Only one"] },
    { coupleNames: ["{GuestName}", "Adaora"] },
  ])("rejects invalid settings %j", (patch) => {
    expect(renderInvitationMessages(recipient, { ...settings, ...patch }).ok).toBe(false);
  });
});
