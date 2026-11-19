import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ access: vi.fn(), select: vi.fn() }));
vi.mock("../server/current-admin-access", () => ({ withCurrentAdminAccess: mocks.access }));
vi.mock("@/modules/shared/server/db/client", () => ({ db: { select: mocks.select } }));
vi.mock("@/modules/shared/server/settings", () => ({ getEventSettings: vi.fn() }));
vi.mock("@/modules/shared/lib/env/client", () => ({
  clientEnv: { NEXT_PUBLIC_SITE_URL: "https://example.com" },
}));
import { loadSavedInvitationSharing } from "../server/saved-invitation-sharing";
beforeEach(() => vi.resetAllMocks());
it("does not read invitation credentials when access is denied", async () => {
  mocks.access.mockResolvedValue({ ok: false, message: "Sign in first" });
  expect(await loadSavedInvitationSharing("6f1c2a4e-8b3d-4c5a-9e7f-1a2b3c4d5e6f")).toEqual({
    ok: false,
    message: "Sign in first",
  });
  expect(mocks.select).not.toHaveBeenCalled();
});
it("rejects malformed IDs before querying", async () => {
  expect((await loadSavedInvitationSharing("invalid")).ok).toBe(false);
  expect(mocks.select).not.toHaveBeenCalled();
});
