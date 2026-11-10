import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  TICKET_STATUSES,
  canMove,
  orderStatusFrom,
  ticketMoveSchema,
  type TicketStatus,
} from "../lib/ticket-status";

describe("canMove", () => {
  const legal: [TicketStatus, TicketStatus][] = [
    ["received", "preparing"],
    ["received", "served"],
    ["received", "cancelled"],
    ["preparing", "served"],
    ["preparing", "cancelled"],
  ];

  it("allows exactly the legal moves and nothing else", () => {
    for (const from of TICKET_STATUSES)
      for (const to of TICKET_STATUSES)
        expect(canMove(from, to), `${from} → ${to}`).toBe(
          legal.some(([a, b]) => a === from && b === to),
        );
  });

  it("treats served and cancelled as final", () => {
    for (const to of TICKET_STATUSES) {
      expect(canMove("served", to)).toBe(false);
      expect(canMove("cancelled", to)).toBe(false);
    }
  });
});

describe("ticketMoveSchema", () => {
  const move = { stationOrderId: randomUUID(), from: "received", to: "preparing" };

  it("accepts a move and requires a reason only to cancel", () => {
    expect(ticketMoveSchema.safeParse(move).success).toBe(true);
    expect(ticketMoveSchema.safeParse({ ...move, to: "cancelled" }).success).toBe(false);
    expect(ticketMoveSchema.safeParse({ ...move, to: "cancelled", reason: "   " }).success).toBe(
      false,
    );
    expect(
      ticketMoveSchema.safeParse({ ...move, to: "cancelled", reason: "Guest left" }).success,
    ).toBe(true);
  });

  it("refuses unknown statuses, long reasons and extra fields", () => {
    expect(ticketMoveSchema.safeParse({ ...move, to: "ready" }).success).toBe(false);
    expect(
      ticketMoveSchema.safeParse({ ...move, to: "cancelled", reason: "x".repeat(201) }).success,
    ).toBe(false);
    expect(ticketMoveSchema.safeParse({ ...move, staffId: randomUUID() }).success).toBe(false);
  });
});

describe("orderStatusFrom", () => {
  it.each([
    [["received"], "received"],
    [["received", "received"], "received"],
    [["preparing", "received"], "preparing"],
    [["served", "received"], "preparing"],
    [["served", "served"], "served"],
    [["served", "cancelled"], "served"],
    [["cancelled", "cancelled"], "cancelled"],
    [["cancelled", "received"], "received"],
    [[], "cancelled"],
  ] as [TicketStatus[], TicketStatus][])("%j → %s", (tickets, status) => {
    expect(orderStatusFrom(tickets)).toBe(status);
  });
});
