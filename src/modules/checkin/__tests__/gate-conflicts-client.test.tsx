// @vitest-environment jsdom
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useGateConflicts } from "../components/use-gate-conflicts";
import { GateConflicts } from "../components/gate-conflicts";
const session = "a".repeat(64);
const expiresAt = Date.now() + 60_000;
function Harness({ token = session }: { token?: string }) {
  const { value } = useGateConflicts(token, expiresAt);
  return <GateConflicts value={value} />;
}
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
it("does not publish a response for a previous scanner session", async () => {
  const pending = Promise.withResolvers<Response>();
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValue(new Response("Unavailable", { status: 503 })),
  );
  const view = render(<Harness />);
  view.rerender(<Harness token={"b".repeat(64)} />);
  await act(async () => pending.resolve(Response.json({ session, expiresAt, entries: [] })));
  expect(screen.queryByText("No entry conflicts reported.")).toBeNull();
  await waitFor(() => expect(screen.getByText(/Reconnect to see/)).toBeVisible());
});
it("removes private list contents on loss of connection instead of showing stale certainty", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(Response.json({ session, expiresAt, entries: [] })),
  );
  render(<Harness />);
  await waitFor(() => expect(screen.getByText("No entry conflicts reported.")).toBeVisible());
  act(() => window.dispatchEvent(new Event("offline")));
  expect(screen.queryByText("No entry conflicts reported.")).toBeNull();
  expect(screen.getByText(/Reconnect to see/)).toBeVisible();
});
it("shows the immutable conflicting count and the administrator's resolution note", () => {
  render(
    <GateConflicts
      value={{
        state: "ready",
        entries: [
          {
            id: "11111111-1111-4111-8111-111111111111",
            household: "Ada and Uchenna",
            staff: "Gate operator",
            device: "North gate",
            reportedAt: "2026-12-19T12:00:00.000Z",
            receivedAt: "2026-12-19T12:01:00.000Z",
            reportedPeople: 4,
            admittedPeople: 0,
            resolution: "explained",
          },
        ],
      }}
    />,
  );
  expect(screen.getByText(/4 reported entering · 0 added/)).toBeVisible();
  expect(screen.getByText(/Discrepancy explained/)).toBeVisible();
  expect(screen.getByText("Gate operator · North gate")).toBeVisible();
});
