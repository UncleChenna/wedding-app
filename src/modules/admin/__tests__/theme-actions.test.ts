import { beforeEach, expect, it, vi } from "vitest";
import { themes } from "@/modules/theming/themes";
const ports = vi.hoisted(() => ({ access: vi.fn(), save: vi.fn(), activate: vi.fn() }));
vi.mock("../server/current-admin-access", () => ({ currentAdminAccess: ports.access }));
vi.mock("@/modules/theming/server/theme-draft-repository", () => ({
  persistThemeDraft: ports.save,
}));
vi.mock("@/modules/theming/server/active-themes", () => ({
  activateThemeSelection: ports.activate,
}));
vi.mock("next/navigation", () => ({ unstable_rethrow: vi.fn() }));
import { saveThemeDraftAction, activateThemeDraftAction } from "../server/theme-actions";

beforeEach(() => {
  vi.resetAllMocks();
  ports.access.mockResolvedValue({ status: "ready", userId: "synthetic-admin" });
});
it.each(["signed-out", "denied", "enroll", "challenge"])(
  "refuses both mutations for %s without storage access",
  async (status) => {
    ports.access.mockResolvedValue({ status });
    expect((await saveThemeDraftAction(null)).status).toBe("denied");
    expect((await activateThemeDraftAction(null)).status).toBe("denied");
    expect(ports.save).not.toHaveBeenCalled();
    expect(ports.activate).not.toHaveBeenCalled();
  },
);
it("saves valid drafts only after the ready administrator check", async () => {
  const theme = themes[0];
  if (!theme) throw new Error("Missing theme fixture");
  expect(await saveThemeDraftAction(theme)).toEqual({ status: "saved", id: theme.id });
  expect(ports.save).toHaveBeenCalledExactlyOnceWith(theme);
  expect(ports.access.mock.invocationCallOrder[0]).toBeLessThan(
    ports.save.mock.invocationCallOrder[0] ?? 0,
  );
});
it("activates through the atomic publication/cache service", async () => {
  const selection = { light: "ivory-gold", dark: "emerald-night" };
  expect(await activateThemeDraftAction(selection)).toEqual({ status: "activated" });
  expect(ports.activate).toHaveBeenCalledExactlyOnceWith(selection);
});
it("does not disclose storage exception text", async () => {
  ports.activate.mockRejectedValue(new Error("private connection details"));
  const result = await activateThemeDraftAction({ light: "ivory-gold", dark: "emerald-night" });
  expect(result.status).toBe("unavailable");
  expect(JSON.stringify(result)).not.toContain("private connection");
});
