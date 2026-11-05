// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";
const path = vi.hoisted(() => ({ current: "/admin" }));
vi.mock("next/navigation", () => ({ usePathname: () => path.current }));
import { AdminShell } from "../components/admin-shell";

function renderShell(at: string) {
  path.current = at;
  return render(
    <AdminShell eventName="Uchenna & Adaora">
      <main>
        <h1>Page content</h1>
      </main>
    </AdminShell>,
  );
}

it("names the event and offers every section plus sign-out in one labelled navigation", () => {
  renderShell("/admin");
  expect(screen.getAllByText("Uchenna & Adaora")).not.toHaveLength(0);
  const nav = screen.getByRole("navigation", { name: "Admin" });
  const links = within(nav).getAllByRole("link");
  expect(links.map((link) => [link.textContent, link.getAttribute("href")])).toEqual([
    ["Control room", "/admin"],
    ["Sharing", "/admin/sharing"],
    ["Menu", "/admin/menu"],
    ["Settings", "/admin/settings"],
    ["Sign out", "/admin/sign-out"],
  ]);
  expect(screen.getByRole("heading", { name: "Page content" })).toBeVisible();
});

it("marks only the current section, including on nested pages", () => {
  renderShell("/admin");
  expect(screen.getByRole("link", { name: "Control room" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  expect(screen.getByRole("link", { name: "Sharing" })).not.toHaveAttribute("aria-current");
  renderShell("/admin/sharing/anything");
  expect(screen.getAllByRole("link", { name: "Sharing" }).at(-1)).toHaveAttribute(
    "aria-current",
    "page",
  );
  expect(screen.getAllByRole("link", { name: "Control room" }).at(-1)).not.toHaveAttribute(
    "aria-current",
  );
});
