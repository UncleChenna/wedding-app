import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ authorize: vi.fn(), transaction: vi.fn() }));
vi.mock("../server/current-admin-access", () => ({ requireAdminPageAccess: mocks.authorize }));
vi.mock("@/modules/shared/server/db/client", () => ({ db: { transaction: mocks.transaction } }));
import { getGatePrintList } from "../server/gate-print";
beforeEach(() => vi.resetAllMocks());
it("authorizes before reading private export data", async () => {
  mocks.authorize.mockRejectedValue(new Error("redirect"));
  await expect(getGatePrintList()).rejects.toThrow("redirect");
  expect(mocks.transaction).not.toHaveBeenCalled();
});
it("takes one read-only snapshot, exports all members and omits contacts and bearer links", async () => {
  const where = vi
    .fn()
    .mockResolvedValueOnce([
      {
        id: "one",
        status: "rsvp_yes",
        householdName: "Family",
        countAttending: 2,
        tableNumber: 3,
        admittedPeople: 1,
      },
    ])
    .mockReturnValueOnce({
      orderBy: async () => [
        { invitationId: "one", name: "Ada Okafor", isPrimary: true },
        { invitationId: "one", name: "Obi Okafor", isPrimary: false },
      ],
    });
  const chain = { leftJoin: vi.fn(), innerJoin: vi.fn(), where };
  chain.leftJoin.mockReturnValue(chain);
  chain.innerJoin.mockReturnValue(chain);
  const select = vi.fn().mockReturnValue({ from: () => chain });
  mocks.transaction.mockImplementation(
    async (run: (tx: { select: typeof select }) => Promise<unknown>) => run({ select }),
  );
  const result = await getGatePrintList();
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error("Expected export");
  expect(result.rows[0]?.names).toEqual(["Ada Okafor", "Obi Okafor"]);
  expect(result.rows[0]?.marks).toEqual([true, false]);
  expect(mocks.transaction).toHaveBeenCalledWith(expect.any(Function), {
    isolationLevel: "repeatable read",
    accessMode: "read only",
  });
  for (const [projection] of select.mock.calls) {
    expect(projection).not.toHaveProperty("token");
    expect(projection).not.toHaveProperty("email");
    expect(projection).not.toHaveProperty("phone");
    expect(projection).not.toHaveProperty("notes");
    expect(projection).not.toHaveProperty("dietaryNotes");
    expect(projection).not.toHaveProperty("dietary_notes");
  }
});
it("shows an actionable failure instead of a falsely empty printable list", async () => {
  mocks.transaction.mockRejectedValue(new Error("database secret"));
  expect(await getGatePrintList()).toEqual({
    ok: false,
    message: "The gate list couldn't load. Please try again before printing.",
  });
});
