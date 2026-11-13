import { randomUUID } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { hostBoardSchema, hostServeSchema, type HostServe } from "../lib/host-board";
import { hostBoardResponse, hostServeResponse } from "../server/host-routes";
import type { TicketMoveResult } from "../lib/ticket-status";
import type { HostActor } from "../server/host-serve";

vi.mock("server-only", () => ({}));
vi.mock("@/modules/shared/server/db/client", () => ({ db: {} }));
vi.mock("@/modules/shared/server/staff-cookies", () => ({ currentStaffDevice: vi.fn() }));

const actor: HostActor = { staffId: randomUUID(), deviceId: randomUUID() };
const origin = "http://localhost:3000";
const post = (body: unknown, headers: Record<string, string> = { origin }) =>
  new Request(`${origin}/api/host/tickets`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });

describe("host serve contract (TICKET-082)", () => {
  it("only describes a serve: a target status or a cancel reason is refused", () => {
    const id = randomUUID();
    expect(hostServeSchema.safeParse({ stationOrderId: id, from: "preparing" }).success).toBe(true);
    expect(
      hostServeSchema.safeParse({ stationOrderId: id, from: "received", to: "cancelled" }).success,
    ).toBe(false);
    expect(
      hostServeSchema.safeParse({ stationOrderId: id, from: "received", reason: "x" }).success,
    ).toBe(false);
    expect(hostServeSchema.safeParse({ stationOrderId: id, from: "served" }).success).toBe(false);
  });

  it("never carries dietary notes or guest names on the host board", () => {
    const ticket = {
      id: randomUUID(),
      station: "kitchen",
      status: "received",
      createdAt: "2026-11-21T15:00:00.000Z",
      table: { number: 3, name: null },
      items: [{ name: "Jollof rice", quantity: 1 }],
      note: null,
    };
    const board = { generatedAt: "2026-11-21T15:00:00.000Z", tables: [], tickets: [ticket] };
    expect(hostBoardSchema.safeParse(board).success).toBe(true);
    for (const extra of [{ dietary: [] }, { guestName: "Ada" }])
      expect(
        hostBoardSchema.safeParse({ ...board, tickets: [{ ...ticket, ...extra }] }).success,
      ).toBe(false);
  });
});

describe("hostServeResponse", () => {
  const serve = vi.fn<(a: HostActor, s: HostServe) => Promise<TicketMoveResult>>();

  it("refuses a signed-out device without touching the ticket", async () => {
    const response = await hostServeResponse(post({}), { authorize: async () => null, serve });
    expect(response.status).toBe(403);
    expect(serve).not.toHaveBeenCalled();
  });

  it("refuses a cross-site request", async () => {
    const response = await hostServeResponse(
      post({ stationOrderId: randomUUID(), from: "received" }, { origin: "https://evil.test" }),
      { authorize: async () => actor, serve },
    );
    expect(response.status).toBe(403);
    expect(serve).not.toHaveBeenCalled();
  });

  it("refuses an attempt to cancel", async () => {
    const response = await hostServeResponse(
      post({ stationOrderId: randomUUID(), from: "received", to: "cancelled", reason: "Gone" }),
      { authorize: async () => actor, serve },
    );
    expect(response.status).toBe(400);
    expect(serve).not.toHaveBeenCalled();
  });

  it("serves through the host's own identity and reports refusals in plain words", async () => {
    const id = randomUUID();
    serve.mockResolvedValueOnce({ status: "moved", ticketStatus: "served", movedAt: "x" });
    const ok = await hostServeResponse(post({ stationOrderId: id, from: "preparing" }), {
      authorize: async () => actor,
      serve,
    });
    expect(ok.status).toBe(200);
    expect(serve).toHaveBeenCalledWith(actor, { stationOrderId: id, from: "preparing" });

    serve.mockResolvedValueOnce({ status: "not_found" });
    const other = await hostServeResponse(post({ stationOrderId: id, from: "received" }), {
      authorize: async () => actor,
      serve,
    });
    expect(other.status).toBe(404);
    expect(await other.json()).toMatchObject({ error: "That order isn't on your tables." });
  });
});

describe("hostBoardResponse", () => {
  it("loads only the signed-in host's board", async () => {
    const load = vi.fn(async () => ({
      generatedAt: "2026-11-21T15:00:00.000Z",
      tables: [{ number: 3, name: null }],
      tickets: [],
    }));
    const response = await hostBoardResponse({ authorize: async () => actor, load });
    expect(response.status).toBe(200);
    expect(load).toHaveBeenCalledWith(actor.staffId);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect((await hostBoardResponse({ authorize: async () => null, load })).status).toBe(403);
  });
});
