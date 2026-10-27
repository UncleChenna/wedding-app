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
