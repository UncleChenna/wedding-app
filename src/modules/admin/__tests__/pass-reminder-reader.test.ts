import { beforeEach, expect, it, vi } from "vitest";
import { defaultEventSettings } from "@/modules/shared/lib/event-settings";
const mocks = vi.hoisted(() => ({ authorize: vi.fn(), rows: vi.fn(), settings: vi.fn() }));
vi.mock("../server/current-admin-access", () => ({ requireAdminPageAccess: mocks.authorize }));
vi.mock("../server/pass-reminder-repository", () => ({ readPassReminderRows: mocks.rows }));
vi.mock("@/modules/shared/server/db/client", () => ({ db: {} }));
vi.mock("@/modules/shared/server/settings", () => ({ getEventSettings: mocks.settings }));
vi.mock("@/modules/shared/lib/env/client", () => ({
  clientEnv: { NEXT_PUBLIC_SITE_URL: "https://wedding.example" },
}));
import { getPassReminders } from "../server/pass-reminders";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.settings.mockResolvedValue(defaultEventSettings);
  mocks.rows.mockResolvedValue([]);
});
it("authorizes before querying private household links", async () => {
  mocks.authorize.mockRejectedValue(new Error("redirect"));
  await expect(getPassReminders()).rejects.toThrow("redirect");
  expect(mocks.rows).not.toHaveBeenCalled();
  expect(mocks.settings).not.toHaveBeenCalled();
});
it("distinguishes an empty attending list from a failed read", async () => {
  expect(await getPassReminders()).toEqual({ status: "ready", invitations: [] });
  mocks.rows.mockRejectedValue(new Error("private database details"));
  expect(await getPassReminders()).toEqual({
    status: "error",
    message: "We couldn't load the pass reminders. Please try again.",
  });
});
it("maps each attending household to its own approved reminder", async () => {
  mocks.rows.mockResolvedValue([
    { id: "first", name: "Ada", token: "a".repeat(43), tokenVersion: 2 },
    { id: "second", name: "Uche", token: "b".repeat(43), tokenVersion: 4 },
  ]);
  const result = await getPassReminders();
  expect(result.status).toBe("ready");
  if (result.status !== "ready") throw new Error("Unexpected failure");
  expect(result.invitations.map((row) => row.id)).toEqual(["first", "second"]);
  expect(result.invitations[0]?.share?.url).toBe("https://wedding.example/i/" + "a".repeat(43));
  expect(result.invitations[1]?.tracking?.expectedVersion).toBe(4);
});
