import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ submit: vi.fn(), revalidate: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("../server/submit-rsvp", () => ({ submitRsvp: mocks.submit }));
vi.mock("../server/save-rsvp", () => ({ saveRsvp: vi.fn() }));
vi.mock("@/modules/shared/server/db/client", () => ({ db: {} }));
import { respondToInvitation } from "../server/rsvp-actions";
beforeEach(() => {
  vi.clearAllMocks();
});
it.each(["yes", "no"] as const)("refreshes pass content after saved %s", async (status) => {
  const token = "a".repeat(43);
  const form = new FormData();
  form.set("token", token);
  mocks.submit.mockResolvedValue({ status, message: "Saved" });
  expect(await respondToInvitation({ status: "idle", message: "" }, form)).toEqual({
    status,
    message: "Saved",
  });
  expect(mocks.revalidate).toHaveBeenCalledExactlyOnceWith("/i/" + token);
});
it("does not refresh after a rejected submission", async () => {
  const form = new FormData();
  form.set("token", "invalid");
  mocks.submit.mockResolvedValue({ status: "error", message: "Please try again" });
  await respondToInvitation({ status: "idle", message: "" }, form);
  expect(mocks.revalidate).not.toHaveBeenCalled();
});
