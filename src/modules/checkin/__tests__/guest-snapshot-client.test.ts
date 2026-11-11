import { expect, it, vi } from "vitest";
import { readGuestSnapshot } from "../browser/guest-snapshot-client";
import { scannerWorkerMessage } from "../browser/scanner-worker-message";
vi.mock("../browser/scanner-worker-message", () => ({ scannerWorkerMessage: vi.fn() }));
function snapshot() {
  return {
    version: 1,
    session: "a".repeat(64),
    generatedAt: Date.now(),
    expiresAt: Date.now() + 60_000,
    keys: [{ kid: "test", alg: "Ed25519", spki: "MCowBQYDK2VwAyEA" + "A".repeat(43) }],
    invitations: [],
  };
}
it("accepts only a matching bounded worker projection and clamps its authority deadline", async () => {
  const value = snapshot();
  vi.mocked(scannerWorkerMessage).mockResolvedValue({ state: "ready", snapshot: value });
  expect(await readGuestSnapshot({ ...value, expiresAt: value.expiresAt - 1000 })).toEqual({
    ...value,
    expiresAt: value.expiresAt - 1000,
  });
  expect(scannerWorkerMessage).toHaveBeenCalledWith("READ_GUEST_SNAPSHOT", value.session);
});
it("refuses stale sessions, expired authorization, private extras and malformed replies", async () => {
  const value = snapshot();
  for (const reply of [
    null,
    { state: "ready" },
    { state: "unavailable" },
    { state: "ready", snapshot: { ...value, session: "b".repeat(64) } },
    { state: "ready", snapshot: { ...value, expiresAt: Date.now() } },
    { state: "ready", snapshot: { ...value, phone: "private" } },
  ]) {
    vi.mocked(scannerWorkerMessage).mockResolvedValue(reply);
    expect(await readGuestSnapshot(value)).toBeNull();
  }
});
