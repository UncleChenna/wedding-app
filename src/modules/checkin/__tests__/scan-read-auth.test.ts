import { beforeEach, expect, it, vi } from "vitest";
import { postScanRead } from "../server/scan-read";
import { currentStaffDevice } from "@/modules/shared/server/staff-cookies";
import { resolveScanRead } from "../lib/resolve-scan-read";
vi.mock("@/modules/shared/server/db/client", () => ({ db: {} }));
vi.mock("@/modules/shared/server/staff-cookies", () => ({ currentStaffDevice: vi.fn() }));
vi.mock("../lib/resolve-scan-read", () => ({ resolveScanRead: vi.fn() }));
vi.mock("../server/scan-observation", () => ({ recordScanObservation: vi.fn(async () => true) }));
vi.mock("../server/scan-read-repository", () => ({ readScanGuest: vi.fn() }));
vi.mock("../server/signing", () => ({
  loadGateSigningKeys: () => ({ ok: true, value: {} }),
  gatePublicKeys: () => [],
}));
beforeEach(() => vi.clearAllMocks());
it("suppresses an already resolved private result when live access is revoked during the lookup", async () => {
  vi.mocked(currentStaffDevice)
    .mockResolvedValueOnce({
      identity: { staffId: "synthetic", role: "gate", credentialVersion: 1 },
      device: { id: "device", name: null },
      expiresAt: new Date(Date.now() + 60000),
    })
    .mockResolvedValueOnce({
      identity: { staffId: "synthetic", role: "gate", credentialVersion: 1 },
      device: { id: "device", name: null },
      expiresAt: new Date(Date.now() + 60000),
    })
    .mockResolvedValueOnce(null);
  vi.mocked(resolveScanRead).mockResolvedValue({
    state: "valid",
    guest: {
      name: "PRIVATE GUEST",
      partySize: 1,
      admittedSoFar: 0,
      tableNumber: 2,
      admissions: [],
    },
  });
  const response = await postScanRead(
    new Request("https://wedding.example/api/checkin/read", {
      method: "POST",
      headers: { Origin: "https://wedding.example" },
      body: JSON.stringify({ qr: "private signed pass" }),
    }),
  );
  expect(await response.json()).toEqual({ state: "session_expired" });
  expect(currentStaffDevice).toHaveBeenNthCalledWith(1, "gate");
  expect(currentStaffDevice).toHaveBeenNthCalledWith(3, "gate");
  expect(resolveScanRead).toHaveBeenCalled();
});
