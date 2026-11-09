import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  access: vi.fn(),
  preview: vi.fn(),
  commit: vi.fn(),
  revalidate: vi.fn(),
}));
vi.mock("../server/current-admin-access", () => ({ withCurrentAdminAccess: mocks.access }));
vi.mock("../server/guest-import", () => ({
  previewGuestImport: mocks.preview,
  commitGuestImport: mocks.commit,
}));
vi.mock("@/modules/shared/server/db/client", () => ({ db: {} }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
import { previewGuestImportAction, commitGuestImportAction } from "../server/guest-import-actions";
const input = { previewId: "aabbccdd-1234-4567-8abc-123456789abc", digest: "a".repeat(64) };
beforeEach(() => {
  vi.resetAllMocks();
  mocks.access.mockImplementation(async (run: (id: string) => Promise<unknown>) => ({
    ok: true,
    value: await run("authenticated-admin"),
  }));
});
it("authorizes preview and commit independently before database access", async () => {
  mocks.access.mockResolvedValue({ ok: false, message: "Sign in first." });
  expect((await previewGuestImportAction("csv")).status).toBe("error");
  expect((await commitGuestImportAction(input)).status).toBe("error");
  expect(mocks.preview).not.toHaveBeenCalled();
  expect(mocks.commit).not.toHaveBeenCalled();
});
it("uses the authenticated actor and invalidates only committed results", async () => {
  mocks.preview.mockResolvedValue({ status: "error", message: "Rows", errors: [] });
  await previewGuestImportAction("csv");
  expect(mocks.preview).toHaveBeenCalledWith({}, "csv", "authenticated-admin");
  mocks.commit.mockResolvedValue({ status: "error", message: "Stale" });
  await commitGuestImportAction(input);
  expect(mocks.revalidate).not.toHaveBeenCalled();
  mocks.commit.mockResolvedValue({
    status: "committed",
    invitationIds: [input.previewId],
    count: 1,
    replayed: false,
  });
  await commitGuestImportAction(input);
  expect(mocks.commit).toHaveBeenCalledWith({}, input, "authenticated-admin");
  expect(mocks.revalidate).toHaveBeenCalledWith("/admin/guests");
});
it("does not return database errors or private CSV contents", async () => {
  mocks.preview.mockRejectedValue(new Error("private@email.invalid"));
  mocks.commit.mockRejectedValue(new Error("private bearer"));
  expect(JSON.stringify(await previewGuestImportAction("private csv"))).not.toContain("private");
  expect(JSON.stringify(await commitGuestImportAction(input))).not.toContain("private");
});
