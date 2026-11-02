import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ save: vi.fn(), revalidate: vi.fn() }));
vi.mock("@/modules/shared/server/db/client", () => ({ db: {} }));
vi.mock("../server/save-rsvp", () => ({ saveRsvp: mocks.save }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("next/navigation", () => ({ unstable_rethrow: () => {} }));
import { respondToInvitation } from "../server/rsvp-actions";
const token = "a".repeat(43);
beforeEach(() => vi.clearAllMocks());
it.each(["yes", "no"])("refreshes the saved invitation after a %s reply", async (attendance) => {
  mocks.save.mockResolvedValue("saved");
  const form = new FormData();
  form.set("token", token);
  form.set("attendance", attendance);
  expect((await respondToInvitation({ status: "idle", message: "" }, form)).status).toBe(
    attendance,
  );
  expect(mocks.revalidate).toHaveBeenCalledExactlyOnceWith("/i/" + token);
});
it.each(["unavailable", "not-open"])("does not announce a new step after %s", async (result) => {
  mocks.save.mockResolvedValue(result);
  const form = new FormData();
  form.set("token", token);
  form.set("attendance", "yes");
  expect((await respondToInvitation({ status: "idle", message: "" }, form)).status).toBe("error");
  expect(mocks.revalidate).not.toHaveBeenCalled();
});
it("does not revalidate an invalid path or write invalid input", async () => {
  const form = new FormData();
  form.set("token", "../admin");
  form.set("attendance", "yes");
  expect((await respondToInvitation({ status: "idle", message: "" }, form)).status).toBe("error");
  expect(mocks.save).not.toHaveBeenCalled();
  expect(mocks.revalidate).not.toHaveBeenCalled();
});
