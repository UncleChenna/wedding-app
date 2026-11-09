import { beforeEach, expect, it, vi } from "vitest";
import { guestExportDownload } from "../server/guest-export-download";
import { currentAdminAccess } from "../server/current-admin-access";
import { readGuestExport } from "../server/guest-export";

vi.mock("../server/current-admin-access", () => ({ currentAdminAccess: vi.fn() }));
vi.mock("../server/guest-export", () => ({ readGuestExport: vi.fn() }));
const download = (query = "") =>
  guestExportDownload(new Request(`https://wedding.example/admin/guests/export?${query}`));
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(currentAdminAccess).mockResolvedValue({
    status: "ready",
    userId: "admin",
    factors: [],
  });
  vi.mocked(readGuestExport).mockResolvedValue([]);
});
it.each(["signed-out", "denied", "enroll", "challenge"] as const)(
  "rejects %s before any private query",
  async (status) => {
    vi.mocked(currentAdminAccess).mockResolvedValue({ status, userId: "admin", factors: [] });
    const response = await download();
    expect(response.status).toBe(403);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(readGuestExport).not.toHaveBeenCalled();
  },
);
it("rejects bad filters without querying or returning all rows", async () => {
  const response = await download("status=invalid");
  expect(response.status).toBe(400);
  expect(response.headers.get("cache-control")).toContain("no-store");
  expect(readGuestExport).not.toHaveBeenCalled();
});
it("downloads only filtered rows with fixed private attachment headers", async () => {
  const row = {
    id: "iv",
    name: "Ada",
    status: "revoked" as const,
    tokenVersion: 1,
    countAttending: 2,
    sentAt: null,
    side: null,
    tableId: null,
    tableNumber: null,
    guests: [],
    token: "private-capability",
    notes: "private-note",
    email: "private@example.test",
  };
  vi.mocked(readGuestExport).mockResolvedValue([
    row,
    { ...row, id: "other", name: "Excluded", status: "sent" },
  ]);
  const response = await download("status=revoked");
  expect(response.status).toBe(200);
  expect(response.headers.get("content-disposition")).toBe('attachment; filename="guest-list.csv"');
  expect(response.headers.get("content-type")).toBe("text/csv; charset=utf-8");
  expect(response.headers.get("cache-control")).toContain("no-store");
  expect(response.headers.get("referrer-policy")).toBe("no-referrer");
  expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  const text = await response.text();
  expect(text).toContain('"Ada","revoked","","Yes","2"');
  expect(text).not.toMatch(/Excluded|private-capability|private-note|private@example/);
});
it("reports query failure without leaking private details or an empty successful export", async () => {
  vi.mocked(readGuestExport).mockRejectedValue(new Error("private database password"));
  const response = await download();
  expect(response.status).toBe(503);
  expect(response.headers.get("cache-control")).toContain("no-store");
  expect(await response.text()).not.toContain("password");
});
