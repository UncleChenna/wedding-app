import { beforeEach, expect, it, vi } from "vitest";
import { memoriesDownload } from "../server/memories-download";
import { currentAdminAccess } from "../server/current-admin-access";
import { readMemories } from "../server/memories-repository";
import { renderMemoriesPdf } from "../server/memories-pdf";
import { getStoredActiveThemes } from "@/modules/theming/server/active-themes";
import { getActiveThemes } from "@/modules/theming/lib/registry";

vi.mock("../server/current-admin-access", () => ({ currentAdminAccess: vi.fn() }));
vi.mock("../server/memories-repository", () => ({ readMemories: vi.fn() }));
vi.mock("../server/memories-pdf", () => ({ renderMemoriesPdf: vi.fn() }));
vi.mock("@/modules/theming/server/active-themes", () => ({ getStoredActiveThemes: vi.fn() }));
const totals = {
  invitations: 4,
  repliedYes: 2,
  repliedNo: 1,
  attending: 5,
  admissions: 3,
  menu: [{ name: "Rice", ordered: 8, served: 7 }],
};
const download = (format = "csv", scheme = "light") =>
  memoriesDownload(new Request(`http://localhost/admin/memories/${format}?scheme=${scheme}`), {
    params: Promise.resolve({ format }),
  });
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(currentAdminAccess).mockResolvedValue({
    status: "ready",
    userId: "admin",
    factors: [],
  });
  vi.mocked(readMemories).mockResolvedValue(totals);
  vi.mocked(getStoredActiveThemes).mockResolvedValue(getActiveThemes());
  vi.mocked(renderMemoriesPdf).mockResolvedValue(Buffer.from("%PDF-test"));
});
it.each(["signed-out", "denied", "enroll", "challenge"] as const)(
  "refuses %s before querying or rendering",
  async (status) => {
    vi.mocked(currentAdminAccess).mockResolvedValue({ status, userId: "admin", factors: [] });
    const response = await download();
    expect(response.status).toBe(403);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(readMemories).not.toHaveBeenCalled();
    expect(renderMemoriesPdf).not.toHaveBeenCalled();
  },
);
it.each([
  ["html", "light"],
  ["pdf", "unknown"],
])("rejects invalid format/scheme %s %s", async (format, scheme) => {
  expect((await download(format, scheme)).status).toBe(400);
  expect(readMemories).not.toHaveBeenCalled();
});
it("returns an allowlisted CSV attachment with private headers", async () => {
  vi.mocked(readMemories).mockResolvedValue({
    ...totals,
    contact: "private@example.test",
  } as typeof totals);
  const response = await download();
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toBe("text/csv; charset=utf-8");
  expect(response.headers.get("content-disposition")).toBe(
    'attachment; filename="wedding-memories.csv"',
  );
  expect(response.headers.get("cache-control")).toContain("no-store");
  expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  const content = await response.text();
  expect(content).toContain('"Menu","Rice","8","7"');
  expect(content).not.toContain("private@example.test");
  expect(renderMemoriesPdf).not.toHaveBeenCalled();
});
it("renders PDF using the requested stored theme", async () => {
  const response = await download("pdf", "dark");
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toBe("application/pdf");
  expect(response.headers.get("content-disposition")).toBe(
    'attachment; filename="wedding-memories.pdf"',
  );
  expect(renderMemoriesPdf).toHaveBeenCalledWith(totals, getActiveThemes().dark);
  expect(await response.text()).toBe("%PDF-test");
});
it("fails closed without exposing database details", async () => {
  vi.mocked(readMemories).mockRejectedValue(new Error("private database detail"));
  const response = await download();
  expect(response.status).toBe(503);
  expect(await response.text()).not.toContain("private database detail");
  expect(response.headers.get("cache-control")).toContain("no-store");
});
