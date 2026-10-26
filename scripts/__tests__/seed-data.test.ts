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
    expect(data.rsvps.length).toBeLessThan(data.invitations.length);
    expect(data.rsvps.length).toBeGreaterThan(0);
  });

  it("never exceeds an invitation's seat allowance or a table's capacity", () => {
    for (const invitation of data.invitations) {
      const count = data.guests.filter((g) => g.invitationId === invitation.id).length;
      expect(count).toBeLessThanOrEqual(1 + (invitation.maxTagAlongs ?? 1));
    }
    for (const table of data.tables) {
      expect(data.guests.filter((g) => g.tableId === table.id).length).toBeLessThanOrEqual(
        table.capacity,
      );
    }
  });

  it("keeps response counts and statuses consistent with named guests", () => {
    for (const response of data.rsvps) {
      const invitation = data.invitations.find((item) => item.id === response.invitationId);
      expect(invitation?.status).toBe(response.attending ? "rsvp_yes" : "rsvp_no");
      expect(response.countAttending).toBe(
        response.attending
          ? data.guests.filter((guest) => guest.invitationId === response.invitationId).length
          : 0,
      );
      expect(response.respondedAt).toBeInstanceOf(Date);
    }
  });

  it("uses unique invitation tokens of sufficient length", () => {
    expect(new Set(data.invitations.map((i) => i.token)).size).toBe(data.invitations.length);
    expect(data.invitations.every((i) => (i.token?.length ?? 0) >= 22)).toBe(true);
  });
});
