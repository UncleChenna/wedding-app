import { beforeEach, expect, it, vi } from "vitest";
import { closeEventAction } from "../server/event-closure-action";
import { currentAdminAccess } from "../server/current-admin-access";
import { closeEvent } from "../server/event-closure-repository";
import { revalidatePath } from "next/cache";

vi.mock("../server/current-admin-access", () => ({ currentAdminAccess: vi.fn() }));
vi.mock("../server/event-closure-repository", () => ({ closeEvent: vi.fn() }));
vi.mock("@/modules/shared/server/db/client", () => ({ db: {} }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
function confirmation() {
  const form = new FormData();
  form.set("confirmation", "CLOSE EVENT");
  form.set("eventDate", "2026-12-19");
  form.set("evidencePreserved", "on");
  return form;
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(currentAdminAccess).mockResolvedValue({
    status: "ready",
    userId: "admin",
    factors: [],
  });
  vi.mocked(closeEvent).mockResolvedValue({ status: "closed", staffRevoked: 2, devicesRevoked: 3 });
});
it.each(["signed-out", "denied", "enroll", "challenge"] as const)(
  "refuses %s without mutations",
  async (status) => {
    vi.mocked(currentAdminAccess).mockResolvedValue({ status, userId: "admin", factors: [] });
    expect((await closeEventAction(confirmation())).status).toBe("unauthorized");
    expect(closeEvent).not.toHaveBeenCalled();
  },
);
it("passes explicit confirmation to the transaction and refreshes only after closure", async () => {
  const result = await closeEventAction(confirmation());
  expect(closeEvent).toHaveBeenCalledWith(
    {},
    { confirmation: "CLOSE EVENT", eventDate: "2026-12-19", evidencePreserved: true },
  );
  expect(result).toEqual({ status: "closed", staffRevoked: 2, devicesRevoked: 3 });
  expect(revalidatePath).toHaveBeenCalled();
});
it("does not silently acknowledge admission preservation", async () => {
  const form = confirmation();
  form.delete("evidencePreserved");
  await closeEventAction(form);
  expect(closeEvent).toHaveBeenCalledWith(
    {},
    expect.objectContaining({ evidencePreserved: false }),
  );
});
it("returns a premature closure refusal without refreshing", async () => {
  vi.mocked(closeEvent).mockResolvedValue({
    status: "too-early",
    message: "Wait until the event ends.",
  });
  expect((await closeEventAction(confirmation())).status).toBe("too-early");
  expect(revalidatePath).not.toHaveBeenCalled();
});
it("reports failures without private details or a success result", async () => {
  vi.mocked(closeEvent).mockRejectedValue(new Error("private SQL"));
  const result = await closeEventAction(confirmation());
  expect(result.status).toBe("unavailable");
  expect(JSON.stringify(result)).not.toContain("private SQL");
  expect(revalidatePath).not.toHaveBeenCalled();
});
