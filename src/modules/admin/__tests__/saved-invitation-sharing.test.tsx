// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, expect, it, vi } from "vitest";
vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <span role="img" aria-label={alt} />,
}));
const load = vi.hoisted(() => vi.fn());
vi.mock("../server/saved-invitation-sharing", () => ({ loadSavedInvitationSharing: load }));
vi.mock("../components/share-menu", () => ({
  ShareMenu: ({ triggerLabel }: { triggerLabel: string }) => <button>{triggerLabel}</button>,
}));
import { SavedInvitationSharing } from "../components/saved-invitation-sharing";
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
});
it("offers preview and sending here without opening the guest list", async () => {
  load.mockResolvedValue({
    ok: true,
    card: { cardNumber: 42, guestName: "Sample guest", capacity: 2 },
    invitation: {
      id: "one",
      share: {
        url: "https://example.com/i/private-token",
        subject: "Invitation",
        message: "Welcome",
      },
    },
  });
  render(<SavedInvitationSharing id="one" />);
  await screen.findByRole("button", { name: "Send invitation" });
  expect(screen.queryByRole("region", { name: "Your invitation card" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Preview invitation" }));
  expect(screen.getByRole("region", { name: "Your invitation card" })).toBeInTheDocument();
});
it("keeps the saved invitation recoverable if sharing cannot load", async () => {
  load.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce({
    ok: true,
    invitation: { guidance: "This invitation has been withdrawn." },
  });
  render(<SavedInvitationSharing id="one" />);
  await screen.findByRole("alert");
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  await screen.findByText("This invitation has been withdrawn.");
  expect(screen.queryByRole("button", { name: "Send invitation" })).not.toBeInTheDocument();
});
