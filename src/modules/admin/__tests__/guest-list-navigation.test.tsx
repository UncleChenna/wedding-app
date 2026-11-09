// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
vi.mock("../server/guest-list", () => ({
  getGuestList: async () => ({ ok: true, invitations: [] }),
}));
vi.mock("../components/guest-list", () => ({ GuestList: () => null }));
vi.mock("../components/draft-deleted-notice", () => ({ DraftDeletedNotice: () => null }));
vi.mock("@/modules/shared/components/retry-button", () => ({ RetryButton: () => null }));
import { AdminGuestList } from "../components/admin-guest-list";
it("keeps guest creation and the printable fallback reachable together", async () => {
  render(await AdminGuestList());
  expect(screen.getByRole("link", { name: "Add an invitation" })).toHaveAttribute(
    "href",
    "/admin/guests/new",
  );
  expect(screen.getByRole("link", { name: "Print gate list" })).toHaveAttribute(
    "href",
    "/admin/guests/print",
  );
});
