import { expect, it, vi } from "vitest";
import { gateConflictsResponse } from "../server/gate-conflicts-response";
const session = "a".repeat(64);
const authority = () => ({ session, expiresAt: Date.now() + 60_000 });
const conflict = {
  id: "11111111-1111-4111-8111-111111111111",
  household: "Sample household",
  staff: "Gate operator",
  device: "North entrance",
  reportedAt: "2026-12-19T12:00:00.000Z",
  receivedAt: "2026-12-19T12:01:00.000Z",
  reportedPeople: 4,
  admittedPeople: 0,
  resolution: null,
};
it("requires live gate access before loading conflict evidence", async () => {
  const load = vi.fn(async () => [conflict]);
  expect((await gateConflictsResponse({ authorize: async () => null, load })).status).toBe(401);
  expect(load).not.toHaveBeenCalled();
});
it("withholds conflict details if access changes during the query", async () => {
  const authorize = vi.fn().mockResolvedValueOnce(authority()).mockResolvedValue(null);
  const response = await gateConflictsResponse({ authorize, load: async () => [conflict] });
  expect(response.status).toBe(401);
  expect(await response.text()).not.toContain("Sample household");
});
it("returns only a bounded no-store projection tied to the live scanner session", async () => {
  const response = await gateConflictsResponse({
    authorize: async () => authority(),
    load: async () => [conflict],
  });
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toContain("private, no-store");
  expect(await response.json()).toMatchObject({ session, entries: [conflict] });
  for (const entries of [
    [{ ...conflict, token: "secret" }],
    Array.from({ length: 26 }, () => conflict),
  ])
    expect(
      (
        await gateConflictsResponse({
          authorize: async () => authority(),
          load: async () => entries,
        })
      ).status,
    ).toBe(503);
});
