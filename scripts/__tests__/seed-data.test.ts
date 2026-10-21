import { describe, expect, it } from "vitest";

import { buildSeedData } from "../seed-data";

describe("buildSeedData", () => {
  const data = buildSeedData();

  it("is deterministic", () => {
    expect(buildSeedData()).toEqual(data);
  });

  it("produces a realistic 200-300 guest wedding", () => {
    expect(data.guests.length).toBeGreaterThanOrEqual(200);
    expect(data.guests.length).toBeLessThanOrEqual(300);
    expect(data.rsvps).toHaveLength(data.invitations.length);
  });

  it("never exceeds an invitation's seat allowance or a table's capacity", () => {
    for (const invitation of data.invitations) {
      const count = data.guests.filter((g) => g.invitationId === invitation.id).length;
      expect(count).toBeLessThanOrEqual(invitation.maxGuests ?? 1);
    }
    for (const table of data.tables) {
      expect(data.guests.filter((g) => g.tableId === table.id).length).toBeLessThanOrEqual(
        table.capacity,
      );
    }
  });

  it("uses unique secrets for invitation codes and QR tokens", () => {
    expect(new Set(data.invitations.map((i) => i.code)).size).toBe(data.invitations.length);
    expect(new Set(data.guests.map((g) => g.qrToken)).size).toBe(data.guests.length);
  });
});
