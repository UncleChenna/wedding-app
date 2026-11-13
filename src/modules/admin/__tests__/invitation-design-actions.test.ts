import { beforeEach, expect, it, vi } from "vitest";
const ports = vi.hoisted(() => ({ access: vi.fn(), save: vi.fn(), revalidate: vi.fn() }));
vi.mock("../server/current-admin-access", () => ({ withCurrentAdminAccess: ports.access }));
vi.mock("@/modules/shared/server/db/client", () => ({ db: {} }));
vi.mock("@/modules/shared/server/invitation-design", () => ({ saveInvitationDesign: ports.save }));
vi.mock("next/cache", () => ({ revalidatePath: ports.revalidate }));
vi.mock("next/navigation", () => ({ unstable_rethrow: vi.fn() }));
import { saveInvitationDesignAction } from "../server/invitation-design-actions";
function form() {
  const value = new FormData();
  for (const [key, text] of Object.entries({
    version: "0",
    photoId: "",
    photoAlt: "",
    headline: "Together",
    subline: "Please join us.",
  }))
    value.set(key, text);
  return value;
}
beforeEach(() => {
  vi.resetAllMocks();
  ports.access.mockImplementation(async (operation: (id: string) => Promise<unknown>) => ({
    ok: true,
    value: await operation("synthetic-admin"),
  }));
  ports.save.mockResolvedValue({ status: "saved", version: 1, message: "Saved" });
});
it("refuses unauthenticated mutations before persistence or revalidation", async () => {
  ports.access.mockResolvedValue({ ok: false, message: "Sign in first." });
  expect(await saveInvitationDesignAction({ status: "idle" }, form())).toEqual({
    status: "error",
    message: "Sign in first.",
  });
  expect(ports.save).not.toHaveBeenCalled();
  expect(ports.revalidate).not.toHaveBeenCalled();
});
it.each([null, "", " ", "1e2", "-1"])(
  "rejects missing or malformed revision %s",
  async (version) => {
    const value = form();
    if (version === null) value.delete("version");
    else value.set("version", version);
    expect((await saveInvitationDesignAction({ status: "idle" }, value)).status).toBe("error");
    expect(ports.save).not.toHaveBeenCalled();
  },
);
it("publishes only a successful authorized save and preserves stale-write errors", async () => {
  expect((await saveInvitationDesignAction({ status: "idle" }, form())).status).toBe("saved");
  expect(ports.save).toHaveBeenCalledWith(
    {},
    expect.objectContaining({ version: 0, photoId: null }),
    "synthetic-admin",
  );
  expect(ports.revalidate).toHaveBeenCalledExactlyOnceWith("/", "layout");
  ports.revalidate.mockClear();
  ports.save.mockResolvedValue({ status: "error", message: "Reload first." });
  expect((await saveInvitationDesignAction({ status: "idle" }, form())).status).toBe("error");
  expect(ports.revalidate).not.toHaveBeenCalled();
});
it("does not expose storage exception details", async () => {
  ports.save.mockRejectedValue(new Error("private database secret"));
  const result = await saveInvitationDesignAction({ status: "idle" }, form());
  expect(result.status).toBe("error");
  expect(JSON.stringify(result)).not.toContain("private database");
});
