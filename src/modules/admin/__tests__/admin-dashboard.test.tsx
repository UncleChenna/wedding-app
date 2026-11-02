// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
const access = vi.hoisted(() => vi.fn());
vi.mock("../server/current-admin-access", () => ({ requireAdminPageAccess: access }));
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
    "Live dashboard",
  ]) {
    expect(screen.getByText(name, { exact: true })).toBeVisible();
  }
  expect(screen.getByRole("link", { name: "Sharing" })).toHaveAttribute("href", "/admin/sharing");
  expect(screen.getByRole("link", { name: "Sign out" })).toBeVisible();
  expect(screen.queryByRole("link", { name: "Sign in" })).toBeNull();
});
