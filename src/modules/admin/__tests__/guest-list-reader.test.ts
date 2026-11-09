import { beforeEach, expect, it, vi } from "vitest";
import { defaultEventSettings } from "@/modules/shared/lib/event-settings";
const mocks = vi.hoisted(() => ({
  authorize: vi.fn(),
  select: vi.fn(),
  order: vi.fn(),
  settings: vi.fn(),
}));
vi.mock("../server/current-admin-access", () => ({ requireAdminPageAccess: mocks.authorize }));
vi.mock("@/modules/shared/server/db/client", () => ({ db: { select: mocks.select } }));
vi.mock("@/modules/shared/server/settings", () => ({ getEventSettings: mocks.settings }));
vi.mock("@/modules/shared/lib/env/client", () => ({
  clientEnv: { NEXT_PUBLIC_SITE_URL: "https://wedding.example" },
}));
import { getGuestList } from "../server/guest-list";
beforeEach(() => {
  vi.resetAllMocks();
  mocks.settings.mockResolvedValue(defaultEventSettings);
  const query = { leftJoin: vi.fn(), orderBy: mocks.order };
  query.leftJoin.mockReturnValue(query);
  mocks.select.mockReturnValue({ from: () => query });
});
it("never reads private data or settings before live admin authorization", async () => {
  mocks.authorize.mockRejectedValue(new Error("redirect to MFA"));
  await expect(getGuestList()).rejects.toThrow("redirect to MFA");
  expect(mocks.select).not.toHaveBeenCalled();
  expect(mocks.settings).not.toHaveBeenCalled();
});
it("groups members into one household and preserves revoked RSVP counts without exposing raw tokens", async () => {
  mocks.order
    .mockResolvedValueOnce([
      {
        id: "iv",
        token: "x".repeat(43),
        tokenVersion: 2,
        status: "revoked",
        householdName: null,
        side: null,
        tableId: null,
        tableNumber: null,
        sentAt: null,
        countAttending: 2,
      },
    ])
    .mockResolvedValueOnce([
      { id: "a", invitationId: "iv", name: "Ada" },
      { id: "b", invitationId: "iv", name: "Uchenna" },
    ]);
  const result = await getGuestList();
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error("expected household result");
  expect(result.invitations).toHaveLength(1);
  expect(result.invitations[0]).toMatchObject({
    name: "Ada & Uchenna",
    countAttending: 2,
    status: "revoked",
    tokenVersion: 2,
    guests: [
      { id: "a", name: "Ada" },
      { id: "b", name: "Uchenna" },
    ],
  });
  expect(result.invitations[0]).not.toHaveProperty("token");
  expect(result.invitations[0]?.share).toBeUndefined();
  expect(mocks.select).toHaveBeenCalledTimes(2);
});
it("returns an actionable failure rather than an empty guest list when storage fails", async () => {
  mocks.order.mockRejectedValue(new Error("private database credentials"));
  const result = await getGuestList();
  expect(result).toEqual({
    ok: false,
    message: "Your guest list couldn't load. Please try again shortly.",
  });
  expect(JSON.stringify(result)).not.toContain("credentials");
});
