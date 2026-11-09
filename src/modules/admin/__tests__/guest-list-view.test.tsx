// @vitest-environment jsdom
import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { GuestList } from "../components/guest-list";
import type { GuestListInvitation } from "../lib/guest-list";
vi.mock("../components/invitation-lifecycle-controls", () => ({
  InvitationLifecycleControls: ({ tokenVersion }: { tokenVersion: number }) => (
    <p>Current version {tokenVersion}</p>
  ),
}));

vi.mock("../components/share-menu", () => ({
  ShareMenu: ({ invitation }: { invitation: { url: string } }) => (
    <a href={invitation.url}>Share invitation</a>
  ),
}));
const invitations: GuestListInvitation[] = [
  {
    id: "one",
    name: "Ada household",
    status: "rsvp_yes",
    tokenVersion: 1,
    guests: [
      { id: "ada", name: "Ada" },
      { id: "uche", name: "Uchenna" },
    ],
    countAttending: 2,
    side: "Bride",
    tableId: "table-1",
    tableNumber: 1,
    sentAt: "2026-11-01T12:00:00Z",
    share: { url: "https://example.test/i/first", subject: "Invitation", message: "Join us" },
  },
  {
    id: "two",
    name: "Ben household",
    status: "draft",
    tokenVersion: 1,
    guests: [{ id: "ben", name: "Ben" }],
    countAttending: null,
    side: null,
    tableId: null,
    tableNumber: null,
    sentAt: null,
    guidance: "Publish this invitation before sharing it.",
  },
];

it("combines visible filters, announces results and restores the complete list", () => {
  render(<GuestList invitations={invitations} />);
  fireEvent.change(screen.getByRole("searchbox", { name: "Search guests" }), {
    target: { value: "Uchenna" },
  });
  expect(screen.getByRole("status")).toHaveTextContent("1 of 2 invitations");
  fireEvent.change(screen.getByLabelText("Sent"), { target: { value: "unsent" } });
  expect(screen.getByRole("status")).toHaveTextContent("0 of 2 invitations");
  expect(screen.getByText(/No invitations match/)).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
  expect(
    within(screen.getByRole("list", { name: "Invitations" })).getAllByRole("listitem"),
  ).toHaveLength(2);
});

it("mounts sharing only for an expanded row and refreshes it with a new token version", () => {
  const { rerender } = render(<GuestList invitations={invitations} />);
  expect(screen.queryByRole("link", { name: "Share invitation" })).toBeNull();
  const opener = screen.getByRole("button", { name: "Invitation actions for Ada household" });
  fireEvent.click(opener);
  expect(opener).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByRole("link", { name: "Share invitation" })).toHaveAttribute(
    "href",
    "https://example.test/i/first",
  );
  const updated = invitations.map((invitation) =>
    invitation.id === "one"
      ? {
          ...invitation,
          tokenVersion: 2,
          share: {
            url: "https://example.test/i/second",
            subject: "Invitation",
            message: "Join us",
          },
        }
      : invitation,
  );
  rerender(<GuestList invitations={updated} />);
  expect(screen.getByRole("link", { name: "Share invitation" })).toHaveAttribute(
    "href",
    "https://example.test/i/second",
  );
  expect(screen.getByText("Current version 2")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Invitation actions for Ben household" }));
  expect(screen.queryByRole("link", { name: "Share invitation" })).toBeNull();
  expect(screen.getByText(/Publish this invitation/)).toBeVisible();
});

it("restores focus to results if a mutation removes the expanded row from its status filter", () => {
  const { rerender } = render(<GuestList invitations={invitations} />);
  fireEvent.change(screen.getByLabelText("Invitation status"), { target: { value: "rsvp_yes" } });
  const opener = screen.getByRole("button", { name: "Invitation actions for Ada household" });
  opener.focus();
  fireEvent.click(opener);
  rerender(
    <GuestList
      invitations={invitations.map((row) =>
        row.id === "one" ? { ...row, status: "revoked", share: undefined } : row,
      )}
    />,
  );
  expect(screen.getByRole("status")).toHaveFocus();
  expect(screen.getByRole("status")).toHaveTextContent("0 of 2 invitations");
});
