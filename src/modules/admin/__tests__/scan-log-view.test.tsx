// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { ScanLogView } from "../components/scan-log-view";
import type { ScanLogEntry } from "../lib/scan-log";
afterEach(cleanup);
it("clears visible filter controls when navigation clears the applied filters", () => {
  const props = { entries: [], options, hasMore: false, renderNote: () => null };
  const view = render(
    <ScanLogView {...props} filters={{ page: 1, result: "revoked", source: "offline" }} />,
  );
  expect(screen.getByLabelText("Result")).toHaveValue("revoked");
  view.rerender(<ScanLogView {...props} filters={{ page: 1 }} />);
  expect(screen.getByLabelText("Result")).toHaveValue("");
  expect(screen.getByLabelText("Connection")).toHaveValue("");
});
const row: ScanLogEntry = {
  id: "event-one",
  invitationId: null,
  invitationName: null,
  staffId: "staff-one",
  staffName: "Gate lead",
  deviceId: "device-one",
  deviceName: "North gate",
  reportedAt: "2026-12-19T12:00:00.000Z",
  receivedAt: "2026-12-19T12:20:00.000Z",
  reportedResult: "valid",
  result: "already_used",
  reportedPeople: 2,
  admittedPeople: 0,
  conflict: true,
  source: "offline",
  inputMethod: "manual",
  notes: [{ id: "note-one", recordedAt: "2026-12-19T12:30:00.000Z", resolution: "reviewed" }],
};
const options = { invitations: [], staff: [], devices: [] };
it("shows immutable reported and received evidence, with manual input separate from verdict", () => {
  render(
    <ScanLogView
      entries={[row]}
      options={options}
      filters={{ page: 1 }}
      hasMore={false}
      renderNote={() => <button>Add resolution note</button>}
    />,
  );
  const entry = screen.getByRole("article", { name: "Unknown invitation" });
  expect(within(entry).getByText("Already used")).toBeVisible();
  expect(within(entry).getByText("Valid")).toBeVisible();
  expect(within(entry).getByText("Manual entry")).toBeVisible();
  expect(within(entry).getByText("Offline sync")).toBeVisible();
  expect(within(entry).getByText("Conflict recorded")).toBeVisible();
  expect([...entry.querySelectorAll("time")].map((time) => time.dateTime)).toEqual([
    row.reportedAt,
    row.receivedAt,
    row.notes[0]?.recordedAt,
  ]);
  expect(within(entry).getByText("Reviewed — original evidence retained.")).toBeVisible();
});
it("preserves filters in page links and offers all five result filters, not manual", () => {
  render(
    <ScanLogView
      entries={[row]}
      options={options}
      filters={{ page: 2, source: "offline", conflict: true }}
      hasMore
      renderNote={() => null}
    />,
  );
  expect(screen.getByRole("link", { name: "Older scans" })).toHaveAttribute(
    "href",
    "/admin/scans?page=3&source=offline&conflict=yes",
  );
  const verdicts = within(screen.getByLabelText("Result")).getAllByRole("option");
  expect(verdicts.map((option) => option.getAttribute("value"))).toEqual([
    "",
    "valid",
    "already_used",
    "invalid",
    "revoked",
    "not_rsvped",
  ]);
});
it("distinguishes an empty filtered log without fake records", () => {
  render(
    <ScanLogView
      entries={[]}
      options={options}
      filters={{ page: 1 }}
      hasMore={false}
      renderNote={() => null}
    />,
  );
  expect(screen.getByText("No scans match these filters.")).toBeVisible();
  expect(screen.queryByRole("article")).not.toBeInTheDocument();
});
