import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  current: vi.fn(),
  resolve: vi.fn(),
  log: vi.fn(),
  load: vi.fn(),
}));
vi.mock("@/modules/shared/server/db/client", () => ({ db: {} }));
vi.mock("@/modules/shared/server/staff-cookies", () => ({ currentStaffDevice: mocks.current }));
vi.mock("../lib/resolve-scan-read", () => ({ resolveScanRead: mocks.resolve }));
vi.mock("../server/scan-observation", () => ({ recordScanObservation: mocks.log }));
vi.mock("../server/scan-read-repository", () => ({ readScanGuest: mocks.load }));
vi.mock("../server/signing", () => ({
  loadGateSigningKeys: () => ({ ok: true, value: [] }),
  gatePublicKeys: () => [],
}));
import { postScanRead } from "../server/scan-read";
const staffId = "11111111-1111-4111-8111-111111111111";
const invitationId = "22222222-2222-4222-8222-222222222222";
const request = () =>
  new Request("https://wedding.example/api/checkin/read", {
    method: "POST",
    headers: { Origin: "https://wedding.example" },
    body: JSON.stringify({ qr: "private-token" }),
  });
beforeEach(() => {
  vi.resetAllMocks();
  mocks.current.mockResolvedValue({
    identity: { staffId, credentialVersion: 1 },
    device: { id: "device" },
  });
  mocks.log.mockResolvedValue(true);
});
it.each(["valid", "already_used", "invalid", "revoked", "not_rsvped"] as const)(
  "logs actual HTTP %s verdict with only authenticated identity",
  async (state) => {
    mocks.resolve.mockResolvedValue(
      state === "valid" || state === "already_used"
        ? {
            state,
            guest: {
              name: "Guest",
              partySize: 1,
              admittedSoFar: state === "already_used" ? 1 : 0,
              tableNumber: null,
              admissions: [],
            },
          }
        : { state },
    );
    const response = await postScanRead(request());
    expect(response.status).toBe(200);
    expect(mocks.log).toHaveBeenCalledWith(
      {},
      { staffId, deviceId: "device", credentialVersion: 1 },
      {
        invitationId: null,
        result: state,
        inputMethod: "qr",
        reportedAt: expect.any(Date),
      },
      expect.any(Function),
    );
    expect(JSON.stringify(mocks.log.mock.calls)).not.toContain("private-token");
  },
);
it("only associates a verified identity when the authorized reader found its invitation", async () => {
  mocks.load.mockResolvedValue({ status: "revoked" });
  mocks.resolve.mockImplementation(async (_qr, _origin, _keys, load) => {
    await load(invitationId);
    return { state: "revoked" };
  });
  await postScanRead(request());
  expect(mocks.log.mock.calls[0]?.[2].invitationId).toBe(invitationId);
  mocks.load.mockResolvedValue(null);
  mocks.resolve.mockImplementation(async (_qr, _origin, _keys, load) => {
    await load(invitationId);
    return { state: "unknown" };
  });
  expect(await (await postScanRead(request())).json()).toEqual({ state: "unknown" });
  expect(mocks.log.mock.calls[1]?.[2]).toMatchObject({ invitationId: null, result: "invalid" });
});
it("fails closed on evidence failure and rechecks identity before returning private results", async () => {
  mocks.resolve.mockResolvedValue({ state: "revoked" });
  mocks.log.mockRejectedValue(new Error("private database error"));
  expect(await (await postScanRead(request())).json()).toEqual({ state: "unavailable" });
  mocks.log.mockResolvedValue(false);
  expect(await (await postScanRead(request())).json()).toEqual({ state: "session_expired" });
  mocks.log.mockResolvedValue(true);
  mocks.current
    .mockResolvedValueOnce({
      identity: { staffId, credentialVersion: 1 },
      device: { id: "device" },
    })
    .mockResolvedValueOnce({
      identity: { staffId, credentialVersion: 1 },
      device: { id: "device" },
    })
    .mockResolvedValue(null);
  expect(await (await postScanRead(request())).json()).toEqual({ state: "session_expired" });
});
