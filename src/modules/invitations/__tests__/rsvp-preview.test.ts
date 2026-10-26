import { describe, expect, it } from "vitest";
import { rsvpPartySchema } from "../lib/rsvp-preview";

const validParty = { name: " Alex Taylor ", meal: "vegetarian", guests: [] };

describe("sample RSVP party validation", () => {
  it("trims names and accepts Unicode and the maximum name length", () => {
    expect(rsvpPartySchema.parse(validParty).name).toBe("Alex Taylor");
    expect(rsvpPartySchema.safeParse({ ...validParty, name: "Adaora Ọdịnaka" }).success).toBe(true);
    expect(rsvpPartySchema.safeParse({ ...validParty, name: "A".repeat(80) }).success).toBe(true);
  });
  it("rejects blank/oversized names and unknown meals", () => {
    for (const name of [" ", "A".repeat(81)])
      expect(rsvpPartySchema.safeParse({ ...validParty, name }).success).toBe(false);
    expect(rsvpPartySchema.safeParse({ ...validParty, meal: "" }).success).toBe(false);
    expect(rsvpPartySchema.safeParse({ ...validParty, meal: "not-on-menu" }).success).toBe(false);
  });
  it("validates every companion and caps the sample allowance at two", () => {
    const guest = { id: 1, name: "Sam", meal: "fish" };
    expect(
      rsvpPartySchema.safeParse({ ...validParty, guests: [guest, { ...guest, id: 2 }] }).success,
    ).toBe(true);
    expect(
      rsvpPartySchema.safeParse({ ...validParty, guests: [{ ...guest, name: "" }] }).success,
    ).toBe(false);
    expect(
      rsvpPartySchema.safeParse({ ...validParty, guests: [{ ...guest, meal: "" }] }).success,
    ).toBe(false);
    expect(
      rsvpPartySchema.safeParse({ ...validParty, guests: [guest, guest, guest] }).success,
    ).toBe(false);
  });
});
