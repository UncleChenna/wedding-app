import { expect, it, vi } from "vitest";
import { guestSnapshotResponse } from "../server/guest-snapshot-response";

const authority = () => ({
  session: "a".repeat(64),
  expiresAt: Date.now() + 60_000,
  actor: { staffId: "22222222-2222-4222-8222-222222222222", deviceId: "b".repeat(64) },
});
const projection = () => ({
  keys: [{ kid: "test", alg: "Ed25519", spki: "MCowBQYDK2VwAyEA" + "A".repeat(43) }],
  invitations: [],
});
it("requires gate authority before loading private data", async () => {
  const load = vi.fn(async () => projection());
  const response = await guestSnapshotResponse({ authorize: async () => null, load });
  expect(response.status).toBe(401);
  expect(load).not.toHaveBeenCalled();
});
it("rechecks authority after loading and withholds replaced-session contents", async () => {
  const first = authority();
  const authorize = vi
    .fn()
    .mockResolvedValueOnce(first)
    .mockResolvedValue({ ...first, session: "b".repeat(64) });
  const response = await guestSnapshotResponse({ authorize, load: async () => projection() });
  expect(response.status).toBe(401);
  expect(await response.text()).not.toContain("keys");
});
it("returns the bounded projection with earliest expiry and no-store headers", async () => {
  const first = authority();
  const later = { ...first, expiresAt: first.expiresAt - 1000 };
  const authorize = vi.fn().mockResolvedValueOnce(first).mockResolvedValue(later);
  const response = await guestSnapshotResponse({ authorize, load: async () => projection() });
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({
    ...projection(),
    session: first.session,
    expiresAt: later.expiresAt,
  });
  expect(response.headers.get("Cache-Control")).toContain("private, no-store");
  expect(response.headers.get("X-Wedding-Guest-Snapshot")).toBe("1");
});
it("rejects private extras and errors without exposing their content", async () => {
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
  for (const load of [
    async () => ({ ...projection(), email: "private@example.test" }),
    async () => {
      throw new Error("private database details");
    },
  ]) {
    const response = await guestSnapshotResponse({ authorize: async () => authority(), load });
    expect(response.status).toBe(503);
    expect(await response.text()).not.toMatch(/private@example|database details/);
  }
});

it("publishes only trusted original actor IDs and withholds an identity change during projection", async () => {
  const actor = { staffId: "22222222-2222-4222-8222-222222222222", deviceId: "b".repeat(64) };
  const first = { ...authority(), actor };
  const response = await guestSnapshotResponse({
    authorize: async () => first,
    load: async () => projection(),
  });
  expect(await response.json()).toMatchObject({ version: 2, actor });
  const changed = vi
    .fn()
    .mockResolvedValueOnce(first)
    .mockResolvedValue({ ...first, actor: { ...actor, deviceId: "c".repeat(64) } });
  expect(
    (await guestSnapshotResponse({ authorize: changed, load: async () => projection() })).status,
  ).toBe(401);
});
