// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { GuestSnapshotStatus } from "../components/guest-snapshot-status";
afterEach(cleanup);
const now = Date.now();
it("shows honest saved age and a non-blocking stale warning", () => {
  const refresh = vi.fn();
  render(
    <GuestSnapshotStatus
      summary={{ generatedAt: now - 31 * 60_000, expiresAt: now + 60_000 }}
      now={now}
      refreshing={false}
      failed={false}
      refresh={refresh}
    />,
  );
  expect(screen.getByRole("status")).toHaveTextContent("31 minutes ago");
  expect(screen.getByText(/over 30 minutes old/)).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Refresh guest list" }));
  expect(refresh).toHaveBeenCalledOnce();
});
it("keeps a valid saved list distinguishable from a failed refresh", () => {
  render(
    <GuestSnapshotStatus
      summary={{ generatedAt: now, expiresAt: now + 60_000 }}
      now={now}
      refreshing={false}
      failed
      refresh={vi.fn()}
    />,
  );
  expect(screen.getByRole("status")).toHaveTextContent("saved just now");
  expect(screen.getByText(/Couldn’t refresh/)).toBeVisible();
});
it("shows immediate refresh feedback without claiming unsaved data exists", () => {
  render(
    <GuestSnapshotStatus summary={null} now={now} refreshing failed={false} refresh={vi.fn()} />,
  );
  expect(screen.getByRole("button", { name: "Refreshing…" })).toBeDisabled();
  expect(screen.getByRole("status")).toHaveTextContent("Saving the latest guest list");
});
