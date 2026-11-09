import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  access: vi.fn(),
  save: vi.fn(),
  remove: vi.fn(),
  assign: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock("../server/current-admin-access", () => ({ currentAdminAccess: mocks.access }));
vi.mock("@/modules/shared/server/db/client", () => ({ db: {} }));
vi.mock("../server/seating-repository", () => ({
  saveSeatingTable: mocks.save,
  deleteSeatingTable: mocks.remove,
  assignSeatingTable: mocks.assign,
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.refresh }));
import { saveTableAction, deleteTableAction, assignTableAction } from "../server/seating-actions";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.access.mockResolvedValue({ status: "ready" });
  mocks.save.mockResolvedValue({ ok: true, message: "Table saved." });
});
it.each(["signed-out", "denied", "enroll", "challenge"])(
  "blocks %s before any seating mutation",
  async (status) => {
    mocks.access.mockResolvedValue({ status });
    for (const action of [saveTableAction, deleteTableAction, assignTableAction])
      expect((await action({})).ok).toBe(false);
    expect(mocks.save).not.toHaveBeenCalled();
    expect(mocks.remove).not.toHaveBeenCalled();
    expect(mocks.assign).not.toHaveBeenCalled();
  },
);
it("refreshes admin and current-pass views after an authorized success", async () => {
  expect((await saveTableAction({})).ok).toBe(true);
  expect(mocks.refresh).toHaveBeenCalledWith("/admin/guests/seating");
  expect(mocks.refresh).toHaveBeenCalledWith("/admin/guests");
  expect(mocks.refresh).toHaveBeenCalledWith("/p/[pass]", "page");
});
it("keeps an expected rejection visible and hides unexpected database details", async () => {
  mocks.save.mockResolvedValueOnce({ ok: false, message: "Move households first." });
  expect(await saveTableAction({})).toEqual({ ok: false, message: "Move households first." });
  expect(mocks.refresh).not.toHaveBeenCalled();
  mocks.save.mockRejectedValueOnce(new Error("private credentials"));
  expect(await saveTableAction({})).toEqual({
    ok: false,
    message: "Your seating change couldn't be saved. Please try again shortly.",
  });
});
