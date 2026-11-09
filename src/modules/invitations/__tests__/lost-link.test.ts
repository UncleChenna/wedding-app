import { describe, expect, it } from "vitest";
import { lostLinkRequestSchema, matchLostLinkRequest } from "../lib/lost-link";

const request = { name: "Ada Okafor", contact: "ada@example.test" };
const guest = {
  invitationId: "invitation-one",
  name: "Ada Okafor",
  email: "ada@example.test",
  phone: "+447700900123",
  status: "rsvp_yes",
};

describe("lost invitation requests", () => {
  it("normalizes whitespace and email without guessing another address", () => {
    expect(
      lostLinkRequestSchema.parse({ name: "  Ada   Okafor ", contact: " ADA@EXAMPLE.TEST " }),
    ).toEqual({ name: "Ada Okafor", contact: "ada@example.test", contactKind: "email" });
  });

  it("normalizes a supported phone using the existing contact rules", () => {
    expect(lostLinkRequestSchema.parse({ name: "Ada", contact: "07700 900123" })).toEqual({
      name: "Ada",
      contact: "+447700900123",
      contactKind: "phone",
    });
  });

  it.each([
    { ...request, name: " " },
    { ...request, name: "x".repeat(201) },
    { ...request, name: "Ada\nOkafor" },
    { ...request, contact: "not a contact" },
    { ...request, contact: "ada@example.test\nBcc: other@example.test" },
    { ...request, contact: "x".repeat(255) },
  ])("rejects malformed or oversized input %j", (value) => {
    expect(lostLinkRequestSchema.safeParse(value).success).toBe(false);
  });

  it("requires both exact normalized name and contact", () => {
    const parsed = lostLinkRequestSchema.parse(request);
    expect(matchLostLinkRequest(parsed, [guest])).toBe("invitation-one");
    expect(matchLostLinkRequest(parsed, [{ ...guest, name: "Ada Other" }])).toBeNull();
    expect(matchLostLinkRequest(parsed, [{ ...guest, email: "other@example.test" }])).toBeNull();
    expect(matchLostLinkRequest(parsed, [])).toBeNull();
  });

  it("handles case and whitespace but does not strip accents or use fuzzy matching", () => {
    const parsed = lostLinkRequestSchema.parse(request);
    expect(matchLostLinkRequest(parsed, [{ ...guest, name: " ADA  OKAFOR " }])).toBe(
      "invitation-one",
    );
    expect(matchLostLinkRequest(parsed, [{ ...guest, name: "Áda Okafor" }])).toBeNull();
  });

  it("matches canonical phone and never matches contact against a different guest's name", () => {
    const parsed = lostLinkRequestSchema.parse({ ...request, contact: "07700900123" });
    expect(matchLostLinkRequest(parsed, [guest])).toBe("invitation-one");
    expect(
      matchLostLinkRequest(parsed, [
        { ...guest, name: "Other Guest" },
        { ...guest, phone: "+447700900124" },
      ]),
    ).toBeNull();
  });

  it("leaves multiple matching invitations unresolved, but deduplicates one household", () => {
    const parsed = lostLinkRequestSchema.parse(request);
    expect(matchLostLinkRequest(parsed, [guest, guest])).toBe("invitation-one");
    expect(
      matchLostLinkRequest(parsed, [guest, { ...guest, invitationId: "invitation-two" }]),
    ).toBeNull();
  });

  it.each(["revoked", "expired", "unknown"])("does not propose a %s invitation", (status) => {
    expect(
      matchLostLinkRequest(lostLinkRequestSchema.parse(request), [{ ...guest, status }]),
    ).toBeNull();
  });
});
