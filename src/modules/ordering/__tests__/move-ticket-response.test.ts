import { randomUUID } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { moveTicketResponse } from "../server/move-ticket-response";

const actor = { station: "kitchen" as const, staffId: randomUUID(), deviceId: "kitchen-tablet" };
const post = (body: unknown) =>
  new Request("http://localhost/api/kitchen/tickets", {
    method: "POST",
    headers: { Origin: "http://localhost" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
const move = { stationOrderId: randomUUID(), from: "received", to: "preparing" };

describe("moveTicketResponse", () => {
  it("refuses a signed-out device and another station's session", async () => {
    const mover = vi.fn();
    for (const authorize of [async () => null, async () => ({ ...actor, station: "bar" as const })])
      expect(
        (await moveTicketResponse("kitchen", post(move), { authorize, move: mover })).status,
      ).toBe(403);
    expect(mover).not.toHaveBeenCalled();
  });

  it("refuses unreadable moves and a cancel without a reason", async () => {
    const mover = vi.fn();
    const deps = { authorize: async () => actor, move: mover };
    expect((await moveTicketResponse("kitchen", post("{"), deps)).status).toBe(400);
    expect(
      (await moveTicketResponse("kitchen", post({ ...move, to: "cancelled" }), deps)).status,
    ).toBe(400);
    expect(mover).not.toHaveBeenCalled();
  });

  it("passes the move on and reports each outcome plainly", async () => {
    const cases = [
      [{ status: "moved", ticketStatus: "preparing", movedAt: "2026-11-21T15:00:00.000Z" }, 200],
      [{ status: "stale", current: "served" }, 409],
      [{ status: "illegal" }, 409],
      [{ status: "not_found" }, 404],
    ] as const;
    for (const [result, code] of cases) {
      const response = await moveTicketResponse("kitchen", post(move), {
        authorize: async () => actor,
        move: async (who, what) => {
          expect(who).toEqual(actor);
          expect(what).toEqual(move);
          return result;
        },
      });
      expect(response.status).toBe(code);
      expect(await response.json()).toMatchObject(result);
      expect(response.headers.get("cache-control")).toBe("private, no-store");
    }
  });

  it("hides storage errors behind a retryable 503", async () => {
    const response = await moveTicketResponse("kitchen", post(move), {
      authorize: async () => actor,
      move: async () => {
        throw new Error("deadlock detected at 10.0.0.1");
      },
    });
    expect(response.status).toBe(503);
    expect(JSON.stringify(await response.json())).not.toContain("10.0.0.1");
  });
});
