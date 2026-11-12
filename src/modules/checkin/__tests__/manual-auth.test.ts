import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  current: vi.fn(),
  search: vi.fn(),
  read: vi.fn(),
  observation: vi.fn(),
  admit: vi.fn(),
}));
vi.mock("@/modules/shared/server/db/client", () => ({ db: {} }));
vi.mock("@/modules/shared/server/staff-cookies", () => ({ currentStaffDevice: mocks.current }));
vi.mock("../server/manual-search-repository", () => ({ searchManualGuests: mocks.search }));
vi.mock("../server/scan-read-repository", () => ({ readScanGuest: mocks.read }));
vi.mock("../server/scan-observation", () => ({ recordScanObservation: mocks.observation }));
vi.mock("../server/online-admission", () => ({ admitVerifiedPass: mocks.admit }));
import { postManualCheckin } from "../server/manual";
const id = "550e8400-e29b-41d4-a716-446655440000";
const identity = { staffId: "staff", deviceId: "device", credentialVersion: 1 };
const current = { identity, device: { id: "device" } };
const request = (body: unknown) =>
  new Request("https://wedding.example/api/checkin/manual", {
    method: "POST",
    headers: { Origin: "https://wedding.example" },
    body: JSON.stringify(body),
  });
beforeEach(() => {
  vi.resetAllMocks();
  mocks.current.mockResolvedValue(current);
  mocks.observation.mockResolvedValue(true);
});
it("passes only authenticated, explicit manual intent to the shared locked admission transaction", async () => {
  mocks.admit.mockResolvedValue({ state: "revoked" });
  const result = await postManualCheckin(
    request({ operation: "admit", invitationId: id, version: 3, clientEventId: id, people: 2 }),
  );
  expect(await result.json()).toEqual({ state: "revoked" });
  expect(mocks.admit).toHaveBeenCalledWith(
    {},
    identity,
    {
      invitationId: id,
      passVersion: 3,
      clientEventId: id,
      people: 2,
      inputMethod: "manual",
    },
    expect.any(Function),
  );
  const reauthorize = mocks.admit.mock.calls[0]?.[3] as () => Promise<boolean>;
  expect(await reauthorize()).toBe(true);
  mocks.current.mockResolvedValue({ ...current, identity: { ...identity, credentialVersion: 2 } });
  expect(await reauthorize()).toBe(false);
});
it("records selected live eligibility as zero-person manual observation without admitting anyone", async () => {
  mocks.read.mockResolvedValue({
    status: "rsvp_yes",
    tokenVersion: 3,
    attending: true,
    countAttending: 2,
    primaryNames: ["Ada"],
    householdName: null,
    tableNumber: 7,
    admittedSoFar: 1,
    admissions: [],
  });
  const response = await postManualCheckin(request({ operation: "read", invitationId: id }));
  expect(await response.json()).toMatchObject({
    state: "selection",
    version: 3,
    result: { state: "valid", guest: { admittedSoFar: 1, tableNumber: 7 } },
  });
  expect(mocks.observation).toHaveBeenCalledWith(
    {},
    identity,
    {
      invitationId: id,
      result: "valid",
      inputMethod: "manual",
      reportedAt: expect.any(Date),
    },
    expect.any(Function),
  );
  expect(mocks.admit).not.toHaveBeenCalled();
});
it("denies before lookup and withholds selected names when observation authorization expires", async () => {
  mocks.current.mockResolvedValue(null);
  expect((await postManualCheckin(request({ operation: "read", invitationId: id }))).status).toBe(
    403,
  );
  expect(mocks.read).not.toHaveBeenCalled();
  mocks.current.mockResolvedValue(current);
  mocks.read.mockResolvedValue(null);
  mocks.observation.mockResolvedValue(false);
  const response = await postManualCheckin(request({ operation: "read", invitationId: id }));
  expect(await response.json()).toEqual({ state: "session_expired" });
  expect(mocks.observation.mock.calls[0]?.[2]).toMatchObject({
    invitationId: null,
    result: "invalid",
  });
});
