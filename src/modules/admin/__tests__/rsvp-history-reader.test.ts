import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ authorize: vi.fn(), transaction: vi.fn() }));
vi.mock("../server/current-admin-access", () => ({ requireAdminPageAccess: mocks.authorize }));
vi.mock("@/modules/shared/server/db/client", () => ({ db: { transaction: mocks.transaction } }));
import { getRsvpHistory } from "../server/rsvp-history";
const id = "00000000-0000-4000-8000-000000000001";
beforeEach(() => vi.resetAllMocks());
it("authorizes before parsing identifiers or reading private history", async () => {
  mocks.authorize.mockRejectedValue(new Error("redirect"));
  await expect(getRsvpHistory("invalid")).rejects.toThrow("redirect");
  expect(mocks.transaction).not.toHaveBeenCalled();
});
it("rejects malformed identifiers without a database query", async () => {
  expect(await getRsvpHistory("invalid")).toEqual({ status: "not-found" });
  expect(mocks.transaction).not.toHaveBeenCalled();
});
it("reads a consistent authorized snapshot and retains every history entry without private actor identifiers", async () => {
  const order = vi.fn().mockResolvedValue([
    {
      id: "change",
      changedAt: new Date("2026-10-01T10:00:00Z"),
      actor: "admin:private-id",
      before: null,
      after: { secret: "private" },
    },
  ]);
  const where = vi
    .fn()
    .mockResolvedValueOnce([{ householdName: "Household" }])
    .mockReturnValueOnce({ orderBy: order });
  const select = vi.fn().mockReturnValue({ from: () => ({ where }) });
  mocks.transaction.mockImplementation(
    async (run: (tx: { select: typeof select }) => Promise<unknown>) => run({ select }),
  );
  expect(await getRsvpHistory(id)).toEqual({
    status: "ready",
    name: "Household",
    entries: [
      {
        id: "change",
        changedAt: "2026-10-01T10:00:00.000Z",
        actor: "Admin",
        before: null,
        after: null,
      },
    ],
  });
  expect(order).toHaveBeenCalledWith(expect.anything(), expect.anything());
  expect(mocks.transaction).toHaveBeenCalledWith(expect.any(Function), {
    isolationLevel: "repeatable read",
    accessMode: "read only",
  });
  for (const [projection] of select.mock.calls) {
    expect(projection).not.toHaveProperty("token");
    expect(projection).not.toHaveProperty("email");
    expect(projection).not.toHaveProperty("phone");
  }
});
it("does not query change history for an absent invitation", async () => {
  const select = vi.fn().mockReturnValue({ from: () => ({ where: async () => [] }) });
  mocks.transaction.mockImplementation(
    async (run: (tx: { select: typeof select }) => Promise<unknown>) => run({ select }),
  );
  expect(await getRsvpHistory(id)).toEqual({ status: "not-found" });
  expect(select).toHaveBeenCalledTimes(1);
});
it("reports database failure without leaking errors or claiming an empty history", async () => {
  mocks.transaction.mockRejectedValue(new Error("private database detail"));
  expect(await getRsvpHistory(id)).toEqual({
    status: "error",
    message: "The reply history couldn't load. Please try again.",
  });
});
