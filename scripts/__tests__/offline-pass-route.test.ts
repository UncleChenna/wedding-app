import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  settings: vi.fn(),
  identity: vi.fn(),
  issue: vi.fn(),
  error: vi.fn(),
}));
vi.mock("@/modules/shared/server/settings", () => ({ getEventSettings: mocks.settings }));
vi.mock("@/modules/shared/server/db/client", () => ({ db: {} }));
vi.mock("@/modules/shared/lib/env/client", () => ({
  clientEnv: { NEXT_PUBLIC_SITE_URL: "https://wedding.test" },
}));
vi.mock("@/modules/shared/lib/logger", () => ({
  logger: { child: () => ({ error: mocks.error }) },
}));
vi.mock("@/modules/invitations/server/pass-identity", () => ({
  findInvitationPassIdentity: mocks.identity,
}));
vi.mock("@/modules/checkin/server/issue-pass", () => ({ issueGatePassFrom: mocks.issue }));
vi.mock("@/modules/theming/server/active-themes", async () => ({
  getStoredActiveThemes: (await import("@/modules/theming/lib/registry")).getActiveThemes,
}));
import { GET } from "@/app/(guest)/i/[token]/offline-pass/route";
const request = () =>
  GET(new Request("https://wedding.test/i/synthetic/offline-pass"), {
    params: Promise.resolve({ token: "synthetic" }),
  });
beforeEach(() => {
  vi.clearAllMocks();
  mocks.identity.mockResolvedValue({ id: "synthetic", tokenVersion: 1 });
  mocks.settings.mockResolvedValue({
    eventDate: "2099-12-19",
    timeZone: "Etc/UTC",
    retentionDays: 90,
  });
  mocks.issue.mockResolvedValue({
    state: "ready",
    pass: { names: ["Synthetic guest"], householdName: null, partySize: 1, tableNumber: null },
    url: "https://wedding.test/p/signed",
  });
});
it("sets server-controlled retention expiry only for an eligible bounded pass", async () => {
  const response = await request();
  expect(response.status).toBe(200);
  expect(response.headers.get("x-wedding-offline-expires")).toBe("2100-03-19T00:00:00.000Z");
  expect(response.headers.get("cache-control")).toContain("no-store");
});
it("keeps offline saving bounded without inventing an undecided venue timezone", async () => {
  mocks.settings.mockResolvedValue({ eventDate: "2099-12-19", timeZone: null, retentionDays: 90 });
  const response = await request();
  expect(response.status).toBe(200);
  expect(response.headers.get("x-wedding-offline-expires")).toBe("2100-03-18T10:00:00.000Z");
});
it("marks expired retention as gone so existing worker copies are removed", async () => {
  mocks.settings.mockResolvedValue({
    eventDate: "2000-01-01",
    timeZone: "Etc/UTC",
    retentionDays: 90,
  });
  const response = await request();
  expect(response.status).toBe(410);
  expect(await response.text()).not.toContain("Synthetic guest");
  expect(mocks.issue).not.toHaveBeenCalled();
});
it("does not turn settings outages into an unbounded copy or expose the error", async () => {
  mocks.settings.mockRejectedValue(new Error("private backend detail"));
  const response = await request();
  expect(response.status).toBe(503);
  expect(await response.text()).not.toContain("private backend");
  expect(mocks.error).toHaveBeenCalledWith("Offline pass could not be prepared");
});
