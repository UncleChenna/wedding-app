// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { RsvpHistoryTimeline } from "../components/rsvp-history-timeline";
afterEach(cleanup);
it("shows every record in supplied newest-first order with semantic timestamps and before/after details", () => {
  const snapshot = {
    status: "rsvp_yes" as const,
    rsvp: { attending: true, countAttending: 2 },
    people: [{ name: "Ada", isPrimary: true, mealChoice: "Rice", dietaryNotes: "No nuts" }],
  };
  render(
    <RsvpHistoryTimeline
      entries={[
        {
          id: "new",
          changedAt: "2026-11-01T10:00:00.000Z",
          actor: "Admin",
          before: snapshot,
          after: { ...snapshot, people: [] },
        },
        {
          id: "old",
          changedAt: "2026-10-01T10:00:00.000Z",
          actor: "Guest",
          before: null,
          after: snapshot,
        },
      ]}
    />,
  );
  const list = screen.getByRole("list", { name: "Reply changes, newest first" });
  expect([...list.children].map((row) => row.getAttribute("data-history-entry"))).toEqual([
    "new",
    "old",
  ]);
  expect(list.querySelector("time")).toHaveAttribute("datetime", "2026-11-01T10:00:00.000Z");
  expect(within(list).getAllByText("Before")).toHaveLength(2);
  expect(within(list).getAllByText("After")).toHaveLength(2);
  expect(screen.getAllByText("Dietary needs: No nuts")).toHaveLength(2);
  expect(screen.getByText("Details were not recorded in this snapshot.")).toBeVisible();
});
it("distinguishes an invitation with no changes from an error", () => {
  render(<RsvpHistoryTimeline entries={[]} />);
  expect(
    screen.getByText("No reply changes have been recorded for this invitation yet."),
  ).toBeVisible();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});
