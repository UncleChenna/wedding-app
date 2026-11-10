import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  barTicketSchema,
  kitchenTicketSchema,
  newTicketIds,
  ticketAge,
  type KitchenBoard,
} from "../lib/station-board";
import { kitchenBoardResponse, stationBoardResponse } from "../server/station-board-response";

const ticket = (overrides: Partial<KitchenBoard["tickets"][number]> = {}) => ({
  id: randomUUID(),
  orderId: randomUUID(),
  status: "received" as const,
  createdAt: "2026-11-21T15:00:00.000Z",
  table: { number: 12, name: "Baobab" },
  items: [{ name: "Jollof rice", quantity: 2 }],
  note: null,
  guestName: null,
  dietary: [{ guest: "Ada Obi", note: "Nut allergy" }],
  ...overrides,
});

describe("ticketAge", () => {
  const start = Date.parse("2026-11-21T15:00:00.000Z");
  it.each([
    [0, "Just now"],
    [59_000, "Just now"],
    [60_000, "1 min"],
    [59 * 60_000, "59 min"],
    [60 * 60_000, "1 h"],
    [65 * 60_000, "1 h 5 min"],
    [-30_000, "Just now"],
  ])("after %i ms says %s", (elapsed, label) => {
    expect(ticketAge("2026-11-21T15:00:00.000Z", start + elapsed)).toBe(label);
  });
});

describe("newTicketIds", () => {
  it("returns only tickets that weren't on the board", () => {
    const [a, b, c] = [ticket(), ticket(), ticket()];
    expect(newTicketIds([a, b], [b, c])).toEqual([c.id]);
    expect(newTicketIds([a], [a])).toEqual([]);
  });
});

describe("station projections", () => {
  it("lets the kitchen carry dietary notes and refuses them on the bar", () => {
    const kitchen = ticket();
    expect(kitchenTicketSchema.safeParse(kitchen).success).toBe(true);
    expect(barTicketSchema.safeParse(kitchen).success).toBe(false);
    const { dietary: _dietary, ...bar } = kitchen;
    expect(barTicketSchema.safeParse(bar).success).toBe(true);
  });

  it("refuses any field outside the contract, such as a phone number", () => {
    expect(kitchenTicketSchema.safeParse({ ...ticket(), phone: "+2348031234567" }).success).toBe(
      false,
    );
  });
});

describe("kitchenBoardResponse", () => {
  const board: KitchenBoard = {
    generatedAt: "2026-11-21T15:00:00.000Z",
    tickets: [ticket()],
    recent: [],
  };

  it("refuses anyone without a live kitchen session", async () => {
    const response = await kitchenBoardResponse({
      authorize: async () => false,
      load: async () => board,
    });
    expect(response.status).toBe(403);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });

  it("returns the board for the kitchen", async () => {
    const response = await kitchenBoardResponse({
      authorize: async () => true,
      load: async () => board,
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(board);
  });

  it("never sends a field outside the contract, and hides errors", async () => {
    const leaky = await kitchenBoardResponse({
      authorize: async () => true,
      // A buggy query returning an extra column: the contract must stop it.
      load: async () => {
        const extra: unknown = { ...board, tickets: [{ ...ticket(), phone: "+2348031234567" }] };
        return extra as KitchenBoard;
      },
    });
    expect(leaky.status).toBe(503);
    expect(JSON.stringify(await leaky.json())).not.toContain("+234");
    const failing = await kitchenBoardResponse({
      authorize: async () => true,
      load: async () => {
        throw new Error("relation orders does not exist at 10.0.0.1");
      },
    });
    expect(failing.status).toBe(503);
    expect(JSON.stringify(await failing.json())).not.toContain("10.0.0.1");
  });
});

describe("bar board response", () => {
  it("never sends dietary notes to the bar, even if a query returned them", async () => {
    const withDietary: unknown = {
      generatedAt: "2026-11-21T15:00:00.000Z",
      tickets: [ticket()],
    };
    const response = await stationBoardResponse("bar", {
      authorize: async () => true,
      load: async () => withDietary as KitchenBoard,
    });
    expect(response.status).toBe(503);
    expect(JSON.stringify(await response.json())).not.toContain("Nut allergy");
  });

  it("asks for bar sign-in, not kitchen", async () => {
    const response = await stationBoardResponse("bar", {
      authorize: async () => false,
      load: async () => ({ generatedAt: "2026-11-21T15:00:00.000Z", tickets: [], recent: [] }),
    });
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "Bar sign-in required." });
  });
});
