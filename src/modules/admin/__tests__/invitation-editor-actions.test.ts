import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  access: vi.fn(),
  save: vi.fn(),
  remove: vi.fn(),
  revalidate: vi.fn(),
}));
vi.mock("../server/current-admin-access", () => ({ withCurrentAdminAccess: mocks.access }));
vi.mock("../server/invitation-editor", () => ({
  saveAdminInvitation: mocks.save,
  deleteAdminDraft: mocks.remove,
}));
vi.mock("@/modules/shared/server/db/client", () => ({ db: {} }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
import {
  saveInvitationEditorAction,
  deleteInvitationDraftAction,
} from "../server/invitation-editor-actions";
const actor = "aabbccdd-1234-4567-8abc-123456789abc";
const id = "6f1c2a4e-8b3d-4c5a-9e7f-1a2b3c4d5e6f";
function form() {
  const data = new FormData();
  for (const [key, value] of Object.entries({
    householdName: "Test household",
    side: "",
    tableId: "",
    maxTagAlongs: "1",
    memberId: "",
    memberName: "Guest",
    memberEmail: "",
    memberPhone: "",
    actor: "forged",
  }))
    data.set(key, value);
  return data;
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.access.mockImplementation(async (run: (id: string) => Promise<unknown>) => ({
    ok: true,
    value: await run(actor),
  }));
});
it("requires live admin access before either mutation", async () => {
  mocks.access.mockResolvedValue({ ok: false, message: "Sign in first." });
  expect(await saveInvitationEditorAction({ status: "idle" }, form())).toMatchObject({
    status: "error",
  });
  expect(await deleteInvitationDraftAction({ status: "idle" }, form())).toMatchObject({
    status: "error",
  });
  expect(mocks.save).not.toHaveBeenCalled();
  expect(mocks.remove).not.toHaveBeenCalled();
  expect(mocks.revalidate).not.toHaveBeenCalled();
});
it("rejects invalid contact fields before writing", async () => {
  const data = form();
  data.set("memberEmail", "invalid");
  data.set("memberPhone", "invalid");
  const result = await saveInvitationEditorAction({ status: "idle" }, data);
  expect(result).toMatchObject({
    status: "error",
    fields: { "members.0.email": expect.any(String), "members.0.phone": expect.any(String) },
  });
  expect(mocks.save).not.toHaveBeenCalled();
});
it("uses authenticated actor, refreshes editor and returns no token", async () => {
  mocks.save.mockResolvedValue({ ok: true, id, snapshot: "b".repeat(64) });
  const result = await saveInvitationEditorAction({ status: "idle" }, form());
  expect(mocks.save.mock.calls[0]?.[2]).toBe(actor);
  expect(mocks.save.mock.calls[0]?.[1]).not.toHaveProperty("actor");
  expect(result).toMatchObject({ status: "saved", id });
  expect(mocks.revalidate).toHaveBeenCalledWith(`/admin/guests/${id}/edit`);
  expect(JSON.stringify(result)).not.toContain("token");
});
it("preserves stale edit failures without invalidation", async () => {
  mocks.save.mockResolvedValue({ ok: false, code: "conflict" });
  const data = form();
  data.set("id", id);
  data.set("snapshot", "a".repeat(64));
  expect(await saveInvitationEditorAction({ status: "idle" }, data)).toMatchObject({
    status: "error",
    message: expect.stringContaining("Reload"),
  });
  expect(mocks.save.mock.calls[0]?.[3]).toEqual({ id, snapshot: "a".repeat(64) });
  expect(mocks.revalidate).not.toHaveBeenCalled();
});
it("requires explicit draft removal confirmation", async () => {
  const data = form();
  data.set("id", id);
  data.set("snapshot", "a".repeat(64));
  expect(await deleteInvitationDraftAction({ status: "idle" }, data)).toMatchObject({
    status: "error",
  });
  expect(mocks.remove).not.toHaveBeenCalled();
  data.set("confirmation", "delete");
  mocks.remove.mockResolvedValue({ ok: false, code: "not_draft" });
  expect(await deleteInvitationDraftAction({ status: "idle" }, data)).toMatchObject({
    status: "error",
    message: expect.stringContaining("Revoke"),
  });
  expect(mocks.revalidate).not.toHaveBeenCalled();
});
