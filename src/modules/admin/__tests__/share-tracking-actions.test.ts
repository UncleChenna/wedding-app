import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  access: vi.fn(),
  record: vi.fn(),
  undo: vi.fn(),
  revalidate: vi.fn(),
}));
vi.mock("../server/current-admin-access", () => ({ withCurrentAdminAccess: mocks.access }));
vi.mock("../server/share-tracking", () => ({
  recordInvitationShare: mocks.record,
  undoInvitationShare: mocks.undo,
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("@/modules/shared/server/db/client", () => ({ db: {} }));
import { recordShareAction, undoShareAction } from "../server/share-tracking-actions";
beforeEach(() => vi.resetAllMocks());
it("requires current admin access for recording and undo", async () => {
  mocks.access.mockResolvedValue({ ok: false, message: "Sign in" });
  expect(await recordShareAction({})).toEqual({ ok: false, message: "Sign in" });
  expect(await undoShareAction({})).toEqual({ ok: false, message: "Sign in" });
  expect(mocks.record).not.toHaveBeenCalled();
  expect(mocks.undo).not.toHaveBeenCalled();
  expect(mocks.revalidate).not.toHaveBeenCalled();
});
it("uses verified actor and refreshes both lists only on success", async () => {
  mocks.access.mockImplementation(async (run: (actor: string) => Promise<unknown>) => ({
    ok: true,
    value: await run("verified"),
  }));
  mocks.record.mockResolvedValue({ ok: true, eventId: "event" });
  expect(await recordShareAction({ actor: "forged" })).toEqual({ ok: true, eventId: "event" });
  expect(mocks.record).toHaveBeenCalledWith({ actor: "forged" }, "verified", {});
  expect(mocks.revalidate).toHaveBeenCalledWith("/admin/sharing");
  expect(mocks.revalidate).toHaveBeenCalledWith("/admin/guests");
  mocks.revalidate.mockClear();
  mocks.undo.mockResolvedValue({ ok: false, message: "Changed" });
  expect(await undoShareAction({})).toEqual({ ok: false, message: "Changed" });
  expect(mocks.revalidate).not.toHaveBeenCalled();
});
