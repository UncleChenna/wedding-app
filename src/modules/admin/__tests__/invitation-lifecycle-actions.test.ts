import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ access: vi.fn(), change: vi.fn(), revalidate: vi.fn() }));
vi.mock("../server/current-admin-access", () => ({ withCurrentAdminAccess: mocks.access }));
vi.mock("../server/invitation-lifecycle", () => ({ changeInvitationLifecycle: mocks.change }));
vi.mock("@/modules/shared/server/db/client", () => ({ db: {} }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
import { changeInvitationLifecycleAction } from "../server/invitation-lifecycle-actions";
const actor = "aabbccdd-1234-4567-8abc-123456789abc";
function form() {
  const data = new FormData();
  for (const [key, value] of Object.entries({
    invitationId: "6f1c2a4e-8b3d-4c5a-9e7f-1a2b3c4d5e6f",
    operation: "reissue",
    expectedVersion: "3",
    expectedStatus: "rsvp_yes",
    confirmation: "confirm",
    actor: "forged",
  }))
    data.set(key, value);
  return data;
}
beforeEach(() => vi.resetAllMocks());
it("does not mutate or invalidate anything without live admin authorization", async () => {
  mocks.access.mockResolvedValue({ ok: false, message: "Please complete two-step sign-in first." });
  const result = await changeInvitationLifecycleAction({ status: "idle" }, form());
  expect(result.status).toBe("error");
  expect(mocks.change).not.toHaveBeenCalled();
  expect(mocks.revalidate).not.toHaveBeenCalled();
});
it("uses the verified actor, ignores client actor claims and refreshes sharing only after success", async () => {
  mocks.access.mockImplementation(async (run: (id: string) => Promise<unknown>) => ({
    ok: true,
    value: await run(actor),
  }));
  mocks.change.mockResolvedValue({
    ok: true,
    operation: "reissue",
    status: "rsvp_yes",
    tokenVersion: 4,
  });
  const result = await changeInvitationLifecycleAction({ status: "idle" }, form());
  expect(mocks.change.mock.calls[0]?.[2]).toBe(actor);
  expect(mocks.change.mock.calls[0]?.[1]).not.toHaveProperty("actor");
  expect(mocks.revalidate).toHaveBeenCalledWith("/admin/sharing");
  expect(result.status).toBe("saved");
  expect(JSON.stringify(result)).not.toContain("token");
});
it("keeps stale-form errors useful without claiming a mutation succeeded", async () => {
  mocks.access.mockImplementation(async (run: (id: string) => Promise<unknown>) => ({
    ok: true,
    value: await run(actor),
  }));
  mocks.change.mockResolvedValue({ ok: false, code: "conflict" });
  const result = await changeInvitationLifecycleAction({ status: "idle" }, form());
  expect(result).toEqual({
    status: "error",
    message: "This invitation changed. Refresh the page and check it again.",
  });
  expect(mocks.revalidate).not.toHaveBeenCalled();
});
