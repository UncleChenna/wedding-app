// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { AdminEventClosure } from "../components/admin-event-closure";
import { requireAdminPageAccess } from "../server/current-admin-access";
import { getEventSettings } from "@/modules/shared/server/settings";
import { defaultEventSettings } from "@/modules/shared/lib/event-settings";
vi.mock("../server/current-admin-access", () => ({ requireAdminPageAccess: vi.fn() }));
vi.mock("@/modules/shared/server/settings", () => ({ getEventSettings: vi.fn() }));
vi.mock("../server/event-closure-action", () => ({ closeEventFormAction: vi.fn() }));
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(requireAdminPageAccess).mockResolvedValue({
    status: "ready",
    userId: "admin",
    factors: [],
  });
  vi.mocked(getEventSettings).mockResolvedValue({
    ...defaultEventSettings,
    coupleNames: [...defaultEventSettings.coupleNames],
    timeZone: null,
  });
});
it("authorizes before loading event settings", async () => {
  vi.mocked(requireAdminPageAccess).mockRejectedValue(new Error("sign in"));
  await expect(AdminEventClosure()).rejects.toThrow("sign in");
  expect(getEventSettings).not.toHaveBeenCalled();
});
it("offers both attachment downloads and refuses closure with undecided time zone", async () => {
  render(await AdminEventClosure());
  expect(screen.getByRole("heading", { name: "After the celebration" })).toBeVisible();
  for (const format of ["PDF", "CSV"]) {
    const link = screen.getByRole("link", { name: `Download ${format}` });
    expect(link).toHaveAttribute("href", `/admin/memories/${format.toLowerCase()}`);
    expect(link).toHaveAttribute("download");
  }
  expect(screen.getByText(/Confirm the wedding date and venue time zone/)).toBeVisible();
  expect(screen.getByRole("button", { name: "Close the event" })).toBeDisabled();
});
