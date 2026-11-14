import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import { buildSeedData } from "../seed-data";

describe("buildSeedData", () => {
  const data = buildSeedData();

  it("seeds the approved device theme pair and the details printed on the card", () => {
    expect(data.eventSettings).toMatchObject({
      activeThemeId: "ivory-gold",
      activeDarkThemeId: "midnight-champagne",
      venue: "St Paul's Anglican Church, Apo Resettlement, Abuja",
      timeZone: "Africa/Lagos",
      orderingOpen: false,
    });
  });

  it("is deterministic", () => {
    expect(buildSeedData()).toEqual(data);
  });

  it("repeats every row hash for both profiles", () => {
    const hash = (rows: unknown) => createHash("sha256").update(JSON.stringify(rows)).digest("hex");
    for (const profile of ["default", "load"] as const) {
      const first = buildSeedData(20261021, profile);
      expect(hash(buildSeedData(20261021, profile))).toBe(hash(first));
      expect(hash(buildSeedData(42, profile))).not.toBe(hash(first));
    }
  });

  it("provides exactly 350 named guests and 30 usable tables for load tests", () => {
    const load = buildSeedData(20261021, "load");
    expect(load.guests).toHaveLength(350);
    expect(load.tables).toHaveLength(30);
    expect(new Set(load.guests.map((guest) => guest.tableId)).size).toBe(30);
    expect(load.guests.every((guest) => guest.tableId)).toBe(true);
    expect(new Set(load.tables.map((table) => table.number)).size).toBe(30);
    expect(load.menuItems).toHaveLength(16);
    expect(load.tables.reduce((sum, table) => sum + table.capacity, 0)).toBeGreaterThanOrEqual(350);
  });

  it("has explicit revoked, declined, partially admitted and sold-out examples", () => {
    expect(data.invitations.some((invitation) => invitation.status === "revoked")).toBe(true);
    expect(data.rsvps.some((rsvp) => !rsvp.attending)).toBe(true);
    expect(data.menuItems.some((item) => item.isAvailable === false)).toBe(true);
    expect(
      data.scanEvents.some((event) => {
        const rsvp = data.rsvps.find((item) => item.invitationId === event.invitationId);
        return event.admittedPeople > 0 && event.admittedPeople < (rsvp?.countAttending ?? 0);
      }),
    ).toBe(true);
  });

  it("seats complete households on the invitation's table", () => {
    for (const profile of ["default", "load"] as const) {
      const fixtures = buildSeedData(20261021, profile);
      for (const invitation of fixtures.invitations) {
        const guests = fixtures.guests.filter((guest) => guest.invitationId === invitation.id);
        for (const guest of guests) expect(guest.tableId ?? null).toBe(invitation.tableId ?? null);
      }
      for (const table of fixtures.tables) {
        expect(
          fixtures.guests.filter((guest) => guest.tableId === table.id).length,
        ).toBeLessThanOrEqual(table.capacity);
      }
    }
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

describe("station order seed contract", () => {
  const data = buildSeedData();

  it("uses the three PRD categories and bounded item caps", () => {
    expect(new Set(data.menuItems.map((item) => item.category))).toEqual(
      new Set(["meal", "soft_drink", "alcohol"]),
    );
    for (const item of data.menuItems) {
      expect(item.maxPerOrder).toBeGreaterThan(0);
      expect(item.maxPerOrder).toBeLessThanOrEqual(100);
    }
  });

  it("keeps one submission and idempotency key across kitchen/bar children", () => {
    expect(new Set(data.orders.map((order) => order.clientRequestId)).size).toBe(
      data.orders.length,
    );
    expect(data.orders.every((order) => typeof order.clientRequestId === "string")).toBe(true);
    const mixed = data.orders.filter(
      (order) =>
        new Set(
          data.stationOrders
            .filter((child) => child.orderId === order.id)
            .map((child) => child.station),
        ).size === 2,
    );
    expect(mixed.length).toBeGreaterThan(0);
    expect(
      new Set(data.stationOrders.map((child) => child.orderId + ":" + child.station)).size,
    ).toBe(data.stationOrders.length);
  });

  it("routes each line to a matching child without duplicating quantities", () => {
    for (const line of data.orderItems) {
      const child = data.stationOrders.find((item) => item.id === line.stationOrderId);
      const menu = data.menuItems.find((item) => item.id === line.menuItemId);
      expect(child).toBeDefined();
      expect(child?.orderId).toBe(line.orderId);
      expect(child?.station).toBe(menu?.station);
      expect(line.quantity).toBeGreaterThan(0);
      expect(line.quantity).toBeLessThanOrEqual(line.quantityLimit ?? 0);
      expect(line.quantityLimit).toBe(menu?.maxPerOrder);
    }
    for (const child of data.stationOrders) {
      expect(["received", "preparing", "served", "cancelled"]).toContain(child.status);
      expect(data.orderItems.some((line) => line.stationOrderId === child.id)).toBe(true);
    }
  });
});
