// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
const location = vi.hoisted(() => ({ path: "/staff" }));
vi.mock("next/navigation", () => ({ usePathname: () => location.path }));
import { StaffHub } from "../components/staff-hub";
import { StaffHeader } from "../components/staff-header";
import { PagePlaceholder } from "../components/page-placeholder";
it("connects the staff hub to every station", () => {
  render(<StaffHub />);
  for (const [name, href] of [
    ["Gate check-in", "/checkin"],
    ["Kitchen board", "/kitchen"],
    ["Bar board", "/bar"],
  ]) {
    expect(screen.getByRole("link", { name })).toHaveAttribute("href", href);
  }
  expect(screen.getByRole("link", { name: "Back to our day" })).toHaveAttribute("href", "/");
});
it.each([
  ["/checkin", "Gate check-in"],
  ["/kitchen", "Kitchen board"],
  ["/bar", "Bar board"],
])("identifies %s in the shared header", (path, label) => {
  location.path = path;
  render(<StaffHeader />);
  expect(screen.getByText(label)).toBeVisible();
  expect(screen.getByRole("link", { name: "Staff home" })).toHaveAttribute("href", "/staff");
});
it("gives unfinished pages a useful way back", () => {
  render(
    <PagePlaceholder
      eyebrow="Table service"
      title="Order to your table"
      description="Please ask a member of the team."
    />,
  );
  expect(screen.getByRole("link", { name: "Back to our day" })).toHaveAttribute("href", "/");
});
