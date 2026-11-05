import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  authorize: vi.fn(),
  select: vi.fn(),
  sharing: vi.fn(),
  offset: vi.fn(),
  join: vi.fn(),
}));
vi.mock("../server/current-admin-access", () => ({ requireAdminPageAccess: mocks.authorize }));
vi.mock("../server/sharing-invitations", () => ({ getSharingInvitations: mocks.sharing }));
vi.mock("@/modules/shared/server/db/client", () => ({ db: { select: mocks.select } }));
import { getLinkRequests } from "../server/link-requests";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.select.mockImplementation(() => ({
    from: () => ({
      orderBy: () => ({ limit: () => ({ offset: mocks.offset }) }),
      innerJoin: mocks.join,
    }),
  }));
  mocks.offset.mockResolvedValue([]);
  mocks.join.mockResolvedValue([]);
  mocks.sharing.mockResolvedValue([]);
});

it("does not read requests, contact details or invitation links before authorization", async () => {
  mocks.authorize.mockRejectedValue(new Error("sign in"));
  await expect(getLinkRequests()).rejects.toThrow("sign in");
  expect(mocks.select).not.toHaveBeenCalled();
  expect(mocks.sharing).not.toHaveBeenCalled();
});

it("returns a private matched invitation and preserves unmatched requests for human review", async () => {
  const row = {
    id: "request",
    name: "Ada",
    contact: "ada@example.test",
    contactKind: "email",
    createdAt: new Date(),
  };
  mocks.offset.mockResolvedValue([row, { ...row, id: "unknown", contact: "unknown@example.test" }]);
  mocks.join.mockResolvedValue([
    { invitationId: "iv", name: "Ada", email: "ada@example.test", phone: null, status: "sent" },
  ]);
  const invitation = {
    id: "iv",
    name: "Ada",
    status: "sent",
    share: { url: "https://example.test/i/private", subject: "Invitation", message: "Welcome" },
  };
  mocks.sharing.mockResolvedValue([invitation]);
  const result = await getLinkRequests();
  expect(result.requests[0]?.invitation).toEqual(invitation);
  expect(result.requests[1]?.invitation).toBeNull();
  expect(mocks.authorize.mock.invocationCallOrder[0]).toBeLessThan(
    mocks.select.mock.invocationCallOrder[0] ?? Infinity,
  );
  expect(invitation.share).not.toHaveProperty("email");
});

it("paginates without silently discarding older requests and bounds invalid page input", async () => {
  mocks.offset.mockResolvedValue(
    Array.from({ length: 51 }, (_, index) => ({
      id: String(index),
      name: "Ada",
      contact: "ada@example.test",
      contactKind: "email",
      createdAt: new Date(),
    })),
  );
  const result = await getLinkRequests("2");
  expect(result.requests).toHaveLength(50);
  expect(result.hasNext).toBe(true);
  expect(mocks.offset).toHaveBeenCalledWith(50);
  expect((await getLinkRequests("-1")).page).toBe(1);
  expect((await getLinkRequests("9999999999")).page).toBe(1);
});
