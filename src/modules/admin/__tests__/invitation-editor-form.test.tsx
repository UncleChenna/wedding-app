// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, expect, it, vi } from "vitest";
vi.mock("../server/invitation-editor-actions", () => ({
  saveInvitationEditorAction: vi.fn(),
  deleteInvitationDraftAction: vi.fn(),
}));
vi.mock("../server/invitation-lifecycle-actions", () => ({
  changeInvitationLifecycleAction: vi.fn(),
}));
import { InvitationEditorForm } from "../components/invitation-editor-form";
import type { InvitationEditorDetails } from "../lib/invitation-editor";
const invitation: InvitationEditorDetails = {
  id: "6f1c2a4e-8b3d-4c5a-9e7f-1a2b3c4d5e6f",
  snapshot: "a".repeat(64),
  status: "draft",
  tokenVersion: 1,
  reply: null,
  values: {
    householdName: "Example household",
    side: "",
    tableId: "",
    maxTagAlongs: "1",
    members: [
      { id: "aabbccdd-1234-4567-8abc-123456789abc", name: "Example guest", email: "", phone: "" },
    ],
  },
};
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
});
afterEach(cleanup);
function submit() {
  const form = screen.getByRole("button", { name: "Save invitation" }).closest("form");
  if (!form) throw new Error("Missing form");
  fireEvent.submit(form);
}
it("focuses invalid fields and retains edited names", async () => {
  const action = vi.fn().mockResolvedValue({
    status: "error",
    message: "Check email",
    fields: { "members.0.email": "Enter a valid email" },
  });
  render(<InvitationEditorForm invitation={invitation} tables={[]} saveAction={action} />);
  fireEvent.change(screen.getByLabelText("Guest 1 name"), { target: { value: "Corrected guest" } });
  submit();
  await waitFor(() => expect(screen.getByLabelText("Guest 1 email")).toHaveFocus());
  expect(screen.getByLabelText("Guest 1 name")).toHaveValue("Corrected guest");
});
it("does not bless stale form values with a refreshed server fingerprint", () => {
  const { rerender, container } = render(
    <InvitationEditorForm invitation={invitation} tables={[]} />,
  );
  fireEvent.change(screen.getByLabelText("Household name"), {
    target: { value: "Unsaved correction" },
  });
  rerender(
    <InvitationEditorForm
      invitation={{
        ...invitation,
        snapshot: "b".repeat(64),
        values: { ...invitation.values, householdName: "Concurrent change" },
      }}
      tables={[]}
    />,
  );
  expect(screen.getByLabelText("Household name")).toHaveValue("Unsaved correction");
  expect(container.querySelector('input[name="snapshot"]')).toHaveValue(invitation.snapshot);
});
it("keeps the successful save fingerprint after a later validation failure", async () => {
  const action = vi
    .fn()
    .mockResolvedValueOnce({
      status: "saved",
      message: "Saved",
      id: invitation.id,
      snapshot: "c".repeat(64),
      values: invitation.values,
    })
    .mockResolvedValueOnce({ status: "error", message: "Check fields" });
  const { container } = render(
    <InvitationEditorForm invitation={invitation} tables={[]} saveAction={action} />,
  );
  submit();
  await screen.findByText("Saved");
  submit();
  await screen.findByText("Check fields");
  expect(container.querySelector('input[name="snapshot"]')).toHaveValue("c".repeat(64));
});
it("allows roster additions/removals but requires one named guest", () => {
  render(<InvitationEditorForm invitation={invitation} tables={[]} />);
  expect(screen.getByRole("button", { name: "Remove guest 1" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Add a named guest" }));
  expect(screen.getByLabelText("Guest 2 name")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Remove guest 2" }));
  expect(screen.queryByLabelText("Guest 2 name")).not.toBeInTheDocument();
});
it("offers revocation instead of permanent deletion for published invitations", () => {
  render(<InvitationEditorForm invitation={{ ...invitation, status: "sent" }} tables={[]} />);
  expect(screen.queryByRole("button", { name: "Delete draft" })).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Revoke invitation: Example household" }),
  ).toBeInTheDocument();
});

it("adopts generated guest ids after saving so a second save preserves identities", async () => {
  const savedValues = {
    ...invitation.values,
    members: [
      ...invitation.values.members,
      { id: "7f1c2a4e-8b3d-4c5a-9e7f-1a2b3c4d5e6f", name: "New guest", email: "", phone: "" },
    ],
  };
  const action = vi.fn().mockResolvedValue({
    status: "saved",
    message: "Saved",
    id: invitation.id,
    snapshot: "d".repeat(64),
    values: savedValues,
  });
  render(<InvitationEditorForm invitation={invitation} tables={[]} saveAction={action} />);
  fireEvent.click(screen.getByRole("button", { name: "Add a named guest" }));
  fireEvent.change(screen.getByLabelText("Guest 2 name"), { target: { value: "New guest" } });
  submit();
  await screen.findByText("Saved");
  submit();
  await waitFor(() => expect(action).toHaveBeenCalledTimes(2));
  expect((action.mock.calls[1]?.[1] as FormData).getAll("memberId")).toEqual(
    savedValues.members.map((member) => member.id),
  );
});
