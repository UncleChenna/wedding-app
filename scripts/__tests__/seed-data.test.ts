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

describe("staff/device seed contract", () => {
  it("never provisions a usable or raw default PIN", () => {
    for (const identity of buildSeedData().staff) {
      expect(identity.pinHash).toBeNull();
      expect(identity.pinIssuedAt).toBeNull();
      expect(identity.pinExpiresAt).toBeNull();
      expect(identity.credentialVersion).toBe(1);
      expect(identity).not.toHaveProperty("pin");
      expect(identity).not.toHaveProperty("rawPin");
    }
  });

  it("registers deterministic named devices for every seeded scan", () => {
    const data = buildSeedData();
    const ids = new Set(data.registeredDevices.map((device) => device.id));
    expect(ids.size).toBe(data.registeredDevices.length);
    expect(data.registeredDevices.map((device) => device.role)).toEqual(["gate", "kitchen", "bar"]);
    for (const device of data.registeredDevices)
      expect(device.name.trim().length).toBeGreaterThan(0);
    for (const scan of data.checkIns) expect(ids.has(scan.deviceId ?? "")).toBe(true);
    expect(buildSeedData().registeredDevices).toEqual(data.registeredDevices);
  });
});
