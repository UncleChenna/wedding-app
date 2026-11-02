import { beforeEach, expect, it, vi } from "vitest";
import { defaultEventSettings } from "@/modules/shared/lib/event-settings";
const mocks = vi.hoisted(() => ({
  authorize: vi.fn(),
  select: vi.fn(),
  settings: vi.fn(),
  order: vi.fn(),
}));
vi.mock("../server/current-admin-access", () => ({ requireAdminPageAccess: mocks.authorize }));
vi.mock("@/modules/shared/server/db/client", () => ({ db: { select: mocks.select } }));
vi.mock("@/modules/shared/server/settings", () => ({ getEventSettings: mocks.settings }));
vi.mock("@/modules/shared/lib/env/client", () => ({
  clientEnv: { NEXT_PUBLIC_SITE_URL: "https://wedding.example/" },
}));
import { getSharingInvitations } from "../server/sharing-invitations";
beforeEach(() => {
  vi.resetAllMocks();
  mocks.settings.mockResolvedValue(defaultEventSettings);
  mocks.select.mockImplementation(() => ({
    from: () => ({
      orderBy: mocks.order,
      where: () => ({ orderBy: mocks.order }),
    }),
  }));
});
it("never queries settings or invitation data when authorization rejects", async () => {
  mocks.authorize.mockRejectedValue(new Error("redirect"));
  await expect(getSharingInvitations()).rejects.toThrow("redirect");
  expect(mocks.select).not.toHaveBeenCalled();
  expect(mocks.settings).not.toHaveBeenCalled();
});
it("authorizes first and groups only the selected primary names", async () => {
  const token = "a".repeat(43);
  mocks.order
    .mockResolvedValueOnce([{ id: "one", token, status: "sent", householdName: null }])
    .mockResolvedValueOnce([
      { invitationId: "one", name: "Amina" },
      { invitationId: "one", name: "Ben" },
    ]);
  const result = await getSharingInvitations();
  expect(mocks.authorize.mock.invocationCallOrder[0]).toBeLessThan(
    mocks.select.mock.invocationCallOrder[0] ?? Infinity,
  );
  expect(result[0]?.name).toBe("Amina & Ben");
  expect(result[0]?.share?.url).toBe("https://wedding.example/i/" + token);
  expect(result[0]).not.toHaveProperty("token");
});
