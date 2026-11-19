// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("../components/admin-invitation-editor", () => ({
  AdminInvitationEditor: () => <p>Guest form</p>,
}));
vi.mock("../server/guest-list", () => ({
  getGuestList: async () => ({ ok: true, invitations: [] }),
}));
vi.mock("../components/guest-list", () => ({ GuestList: () => null }));
vi.mock("../components/draft-deleted-notice", () => ({ DraftDeletedNotice: () => null }));
vi.mock("@/modules/shared/components/retry-button", () => ({ RetryButton: () => null }));
import { AdminGuestList } from "../components/admin-guest-list";
it("opens guest creation in a modal and removes seating from guest tools", async () => {
  render(await AdminGuestList());
  expect(screen.getByRole("link", { name: "Import guests" })).toHaveAttribute(
    "href",
    "/admin/guests/import",
  );
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
  expect(screen.queryByRole("link", { name: "Seating plan" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Add an invitation" }));
  expect(screen.getByRole("dialog", { name: "Add an invitation" })).toBeVisible();
  expect(screen.getByText("Guest form")).toBeVisible();
  expect(screen.getByRole("link", { name: "Print gate list" })).toHaveAttribute(
    "href",
    "/admin/guests/print",
  );
});
