// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
const access = vi.hoisted(() => vi.fn());
vi.mock("../server/current-admin-access", () => ({ requireAdminPageAccess: access }));
const settings = vi.hoisted(() => ({ orderingOpen: false }));
vi.mock("@/modules/shared/server/settings", () => ({ getEventSettings: async () => settings }));
vi.mock("../server/ordering-switch", () => ({ setOrderingOpenAction: vi.fn() }));
import { AdminDashboard } from "../components/admin-dashboard";
it("requires access and offers every area without a redundant sign-in link", async () => {
  access.mockResolvedValue({ status: "ready" });
  render(await AdminDashboard());
  expect(access).toHaveBeenCalledOnce();
  for (const name of [
    "Guests",
    "Sharing",
    "Seating",
    "Menu",
    "Staff",
    "Settings",
    "After the celebration",
    "Live dashboard",
  ]) {
    expect(screen.getByText(name, { exact: true })).toBeVisible();
  }
  expect(screen.getByRole("link", { name: "Sharing" })).toHaveAttribute("href", "/admin/sharing");
  expect(screen.getByRole("link", { name: "Menu" })).toHaveAttribute("href", "/admin/menu");
  expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute("href", "/admin/settings");
  expect(screen.getByRole("link", { name: "Staff" })).toHaveAttribute("href", "/admin/staff");
  expect(screen.getByRole("link", { name: "After the celebration" })).toHaveAttribute(
    "href",
    "/admin/event-closure",
  );
  // Sign-out lives in the admin shell around every page (admin-shell.test.tsx), not in each page.
  expect(screen.queryByRole("link", { name: "Sign out" })).toBeNull();
  expect(screen.queryByRole("link", { name: "Sign in" })).toBeNull();
});

it("shows whether table ordering is open, in words, with the switch to change it", async () => {
  access.mockResolvedValue({ status: "ready" });
  settings.orderingOpen = false;
  const { unmount } = render(await AdminDashboard());
  expect(screen.getByRole("heading", { name: "Table ordering" })).toBeVisible();
  expect(screen.getByText(/Ordering is closed\./)).toBeVisible();
  expect(screen.getByRole("button", { name: "Open ordering" })).toBeVisible();
  unmount();
  settings.orderingOpen = true;
  render(await AdminDashboard());
  expect(screen.getByText(/Ordering is open\./)).toBeVisible();
  expect(screen.getByRole("button", { name: "Close ordering" })).toBeVisible();
});
