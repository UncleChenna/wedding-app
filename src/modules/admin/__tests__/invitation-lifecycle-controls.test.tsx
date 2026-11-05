// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeAll, expect, it, vi } from "vitest";
import { cleanup } from "@testing-library/react";
vi.mock("../server/invitation-lifecycle-actions", () => ({
  changeInvitationLifecycleAction: vi.fn(),
}));
import { InvitationLifecycleControls } from "../components/invitation-lifecycle-controls";
beforeAll(() => {
  if (!HTMLDialogElement.prototype.showModal)
    HTMLDialogElement.prototype.showModal = function () {
      this.open = true;
    };
  if (!HTMLDialogElement.prototype.close)
    HTMLDialogElement.prototype.close = function () {
      this.open = false;
    };
});
afterEach(cleanup);
it("requires a second explicit confirmation and submits the displayed version", async () => {
  const submitAction = vi
    .fn()
    .mockResolvedValue({ status: "saved", message: "Invitation revoked." });
  render(
    <InvitationLifecycleControls
      invitationId="6f1c2a4e-8b3d-4c5a-9e7f-1a2b3c4d5e6f"
      name="Alex Morgan"
      status="rsvp_yes"
      tokenVersion={3}
      submitAction={submitAction}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Revoke invitation: Alex Morgan" }));
  const dialog = screen.getByRole("dialog", { name: "Revoke invitation?" });
  expect(submitAction).not.toHaveBeenCalled();
  expect(within(dialog).getByText(/Offline scanners/)).toBeInTheDocument();
  const confirmationForm = within(dialog)
    .getByRole("button", { name: "Revoke invitation" })
    .closest("form");
  if (!confirmationForm) throw new Error("Confirmation form missing");
  fireEvent.submit(confirmationForm);
  await waitFor(() => expect(submitAction).toHaveBeenCalledOnce());
  const data = submitAction.mock.calls[0]?.[1] as FormData;
  expect(data.get("expectedVersion")).toBe("3");
  expect(data.get("expectedStatus")).toBe("rsvp_yes");
  expect(data.get("confirmation")).toBe("confirm");
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Invitation revoked."));
});
it("lets administrators cancel without calling the mutation", () => {
  const submitAction = vi.fn();
  render(
    <InvitationLifecycleControls
      invitationId="6f1c2a4e-8b3d-4c5a-9e7f-1a2b3c4d5e6f"
      name="Alex Morgan"
      status="revoked"
      tokenVersion={3}
      submitAction={submitAction}
    />,
  );
  expect(
    screen.queryByRole("button", { name: "Revoke invitation: Alex Morgan" }),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Reissue link: Alex Morgan" }));
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(submitAction).not.toHaveBeenCalled();
});
