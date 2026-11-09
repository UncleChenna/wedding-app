import { beforeEach, expect, it, vi } from "vitest";
import { postScanRead } from "../server/scan-read";
import { currentStaff } from "@/modules/shared/server/staff-cookies";
import { resolveScanRead } from "../lib/resolve-scan-read";
vi.mock("@/modules/shared/server/db/client", () => ({ db: {} }));
vi.mock("@/modules/shared/server/staff-cookies", () => ({ currentStaff: vi.fn() }));
vi.mock("../lib/resolve-scan-read", () => ({ resolveScanRead: vi.fn() }));
vi.mock("../server/scan-read-repository", () => ({ readScanGuest: vi.fn() }));
vi.mock("../server/signing", () => ({
  loadGateSigningKeys: () => ({ ok: true, value: {} }),
  gatePublicKeys: () => [],
}));
beforeEach(() => vi.clearAllMocks());
it("suppresses an already resolved private result when live access is revoked during the lookup", async () => {
  vi.mocked(currentStaff)
    .mockResolvedValueOnce({ staffId: "synthetic", role: "gate", credentialVersion: 1 })
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
      body: JSON.stringify({ qr: "private signed pass" }),
    }),
  );
  expect(await response.json()).toEqual({ state: "session_expired" });
  expect(currentStaff).toHaveBeenNthCalledWith(1, "gate");
  expect(currentStaff).toHaveBeenNthCalledWith(2, "gate");
});
