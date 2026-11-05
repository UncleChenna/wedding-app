import { expect, it, vi } from "vitest";
import { credentialSnapshotResponse } from "../server/snapshot-response";
const snapshot = { generatedAt: "2026-12-19T15:00:00.000Z", invitations: [] };
it("requires live gate authorization before reading invitation state", async () => {
  const load = vi.fn().mockResolvedValue(snapshot);
  const response = await credentialSnapshotResponse({ authorize: async () => false, load });
  expect(response.status).toBe(403);
  expect(load).not.toHaveBeenCalled();
  expect(response.headers.get("cache-control")).toBe("private, no-store");
});
it("returns only validated snapshot data with private response headers", async () => {
  const response = await credentialSnapshotResponse({
    authorize: async () => true,
    load: async () => snapshot,
  });
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual(snapshot);
  expect(response.headers.get("referrer-policy")).toBe("no-referrer");
  expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow");
});
it("fails closed for malformed data and does not expose database errors", async () => {
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
  for (const load of [
    async () => ({ ...snapshot, email: "private@example.com" }),
    async () => {
      throw new Error("private database detail");
    },
  ]) {
    const response = await credentialSnapshotResponse({ authorize: async () => true, load });
    expect(response.status).toBe(503);
    expect(await response.text()).not.toMatch(/private@example|database detail/);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  }
});
