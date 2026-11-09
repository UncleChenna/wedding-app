import { describe, expect, it } from "vitest";
import { projectGuestForRole, projectOrderInstructionForRole } from "../lib/dietary-privacy";

const secret = "Private RSVP allergy marker";
const guest = {
  name: "Ada",
  isPrimary: true,
  dietaryNotes: secret,
  email: "private@example.com",
  notes: secret,
  history: [{ dietary_notes: secret }],
  nested: { notes: secret },
};

describe("dietary guest projection contract", () => {
  it.each(["admin", "kitchen"])("preserves dietary notes only for %s", (role) => {
    expect(projectGuestForRole(role, guest)).toEqual({
      name: "Ada",
      isPrimary: true,
      dietaryNotes: secret,
    });
  });
  it("gate gets an explicit identity projection, never arbitrary guest fields", () => {
    expect(projectGuestForRole("gate", guest)).toEqual({ name: "Ada", isPrimary: true });
  });
  it.each(["bar", "anonymous", "unknown", null, undefined])("denies guest data to %s", (role) => {
    expect(projectGuestForRole(role, guest)).toBeNull();
  });
});

describe("order instructions are separate from private RSVP information", () => {
  const order = {
    table: 12,
    items: [{ quantity: 1, name: "Water", dietaryNotes: secret, guest }],
    note: "No ice",
    dietaryNotes: secret,
    guests: [guest],
    history: [guest],
  };
  it.each(["admin", "kitchen", "bar"])(
    "keeps deliberate operational instructions for %s only",
    (role) => {
      expect(projectOrderInstructionForRole(role, order)).toEqual({
        table: 12,
        items: [{ quantity: 1, name: "Water" }],
        note: "No ice",
      });
      expect(JSON.stringify(projectOrderInstructionForRole(role, order))).not.toContain(secret);
    },
  );
  it.each(["gate", "anonymous", "unknown", null])("denies order instructions to %s", (role) => {
    expect(projectOrderInstructionForRole(role, order)).toBeNull();
  });
  it("never derives an operational note from dietary, history or generic notes fields", () => {
    expect(
      projectOrderInstructionForRole("bar", {
        table: 12,
        items: [],
        dietaryNotes: secret,
        notes: secret,
        history: [guest],
      }),
    ).toEqual({ table: 12, items: [] });
  });
});
