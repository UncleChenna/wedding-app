import { describe, expect, it, vi } from "vitest";
import { projectGuestForRole, projectOrderInstructionForRole } from "../lib/dietary-privacy";

import { publishToStation } from "../server/realtime-publish";

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

describe("station publish privacy boundary", () => {
  const order = {
    stationOrderId: "550e8400-e29b-41d4-a716-446655440000",
    orderId: "550e8400-e29b-41d4-a716-446655440001",
    status: "received" as const,
  };
  const extras = [
    { dietaryNotes: secret },
    { dietary_notes: secret },
    { guests: [guest] },
    { history: [{ before: guest }] },
    { note: secret },
    { notes: secret },
  ];
  it.each(["kitchen", "bar"] as const)(
    "%s rejects private or free-text fields before any I/O",
    async (station) => {
      for (const extra of extras) {
        const execute = vi.fn();
        await expect(
          publishToStation({ execute }, station, "order.changed", {
            ...order,
            ...extra,
          }),
        ).rejects.toThrow();
        expect(execute).not.toHaveBeenCalled();
      }
    },
  );
  it("gate rejects private or free-text fields before any I/O", async () => {
    for (const extra of extras) {
      const execute = vi.fn();
      await expect(
        publishToStation({ execute }, "gate", "checkin.recorded", {
          invitationId: order.orderId,
          admitted: 1,
          conflict: false,
          ...extra,
        }),
      ).rejects.toThrow();
      expect(execute).not.toHaveBeenCalled();
    }
  });
});
