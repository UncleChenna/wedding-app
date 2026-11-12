import { expect, it, vi } from "vitest";
import { manualResponse, type ManualPorts } from "../server/manual-response";
const actor = { staffId: "staff", deviceId: "device", credentialVersion: 1 };
const id = "550e8400-e29b-41d4-a716-446655440000";
const request = (input: unknown, origin = "https://wedding.example") =>
  new Request("https://wedding.example/api/checkin/manual", {
    method: "POST",
    headers: { Origin: origin },
    body: JSON.stringify(input),
  });
function ports(): ManualPorts {
  return {
    authorize: vi.fn(async () => actor),
    search: vi.fn(async () => ({
      matches: [{ invitationId: id, name: "Ada", matchedName: "Ada" }],
      hasMore: false,
    })),
    read: vi.fn<ManualPorts["read"]>(async () => ({
      state: "selection",
      invitationId: id,
      version: 1,
      result: { state: "not_rsvped" },
    })),
    admit: vi.fn<ManualPorts["admit"]>(async () => ({
      state: "duplicate",
      people: 1,
      recordedAt: "2026-12-19T12:00:00.000Z",
    })),
  };
}
it("authorizes before reading private names and rejects a changed session after the query", async () => {
  const p = ports();
  p.authorize = vi.fn(async () => null);
  expect((await manualResponse(request({ operation: "search", query: "Ada" }), p)).status).toBe(
    403,
  );
  expect(p.search).not.toHaveBeenCalled();
  p.authorize = vi
    .fn()
    .mockResolvedValueOnce(actor)
    .mockResolvedValueOnce({ ...actor, deviceId: "other" });
  const result = await manualResponse(request({ operation: "search", query: "Ada" }), p);
  expect(result.status).toBe(403);
  expect(JSON.stringify(await result.json())).not.toContain("Ada");
});
it("rejects forged actors, source/method, cross-origin and unbounded input", async () => {
  const p = ports();
  for (const input of [
    { operation: "search", query: "A" },
    { operation: "search", query: "x".repeat(5000) },
    { operation: "search", query: "Ada", staffId: "forged" },
    {
      operation: "admit",
      invitationId: id,
      version: 1,
      people: 1,
      clientEventId: id,
      inputMethod: "qr",
    },
  ])
    expect((await manualResponse(request(input), p)).status).toBe(400);
  expect(
    (
      await manualResponse(
        request({ operation: "search", query: "Ada" }, "https://hostile.example"),
        p,
      )
    ).status,
  ).toBe(400);
  expect(p.search).not.toHaveBeenCalled();
  expect(p.admit).not.toHaveBeenCalled();
});
it("returns minimal no-store search output and fails closed for private extra fields", async () => {
  const p = ports();
  const response = await manualResponse(request({ operation: "search", query: "Ada" }), p);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(await response.json()).toEqual({
    state: "matches",
    matches: [{ invitationId: id, name: "Ada", matchedName: "Ada" }],
    hasMore: false,
  });
  p.search = vi.fn(async () => ({
    matches: [{ invitationId: id, name: "Ada", matchedName: "Ada", email: "PRIVATE" }],
    hasMore: false,
  }));
  const invalid = await manualResponse(request({ operation: "search", query: "Ada" }), p);
  expect(invalid.status).toBe(503);
  expect(await invalid.json()).toEqual({ state: "unavailable" });
});
it("dispatches selections and manual admissions only with authenticated identity", async () => {
  const p = ports();
  const selection = { operation: "read", invitationId: id };
  expect((await manualResponse(request(selection), p)).status).toBe(200);
  expect(p.read).toHaveBeenCalledWith(selection, actor);
  const intent = { operation: "admit", invitationId: id, version: 1, clientEventId: id, people: 1 };
  const result = await manualResponse(request(intent), p);
  expect(p.admit).toHaveBeenCalledWith(intent, actor);
  expect((await result.json()).state).toBe("duplicate");
});
it("does not replace an already committed transaction receipt with a later session denial", async () => {
  const p = ports();
  p.authorize = vi.fn().mockResolvedValueOnce(actor).mockResolvedValueOnce(null);
  const result = await manualResponse(
    request({ operation: "admit", invitationId: id, version: 1, clientEventId: id, people: 1 }),
    p,
  );
  expect(result.status).toBe(200);
  expect(await result.json()).toEqual({
    state: "duplicate",
    people: 1,
    recordedAt: "2026-12-19T12:00:00.000Z",
  });
  // The actual admission adapter reauthorizes inside the locked transaction,
  // before a write. Read operations still recheck before returning private names.
  expect(p.authorize).toHaveBeenCalledTimes(1);
});
