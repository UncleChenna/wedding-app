// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { ScanResultPanel } from "../components/scan-result-panel";
const guest = {
  name: "Ada & Uche",
  partySize: 4,
  admittedSoFar: 2,
  tableNumber: 7,
  admissions: [{ people: 2, timeLabel: "19:42", staffLabel: "Gate lead", deviceLabel: "Gate 1" }],
};
afterEach(cleanup);
it("shows current remaining places without claiming new admission", () => {
  render(<ScanResultPanel state="valid" guest={guest} />);
  expect(screen.getByRole("heading", { name: "Valid pass" })).toBeTruthy();
  expect(screen.getByText("2 places remaining")).toBeTruthy();
  expect(screen.getByText("Table 7")).toBeTruthy();
  expect(screen.getByText(/No admission has been recorded/)).toBeTruthy();
  expect(screen.queryByRole("button", { name: /admit/i })).toBeNull();
});
it("does not leak guest details into invalid and unavailable results", () => {
  const { rerender } = render(<ScanResultPanel state="invalid" guest={guest} />);
  expect(screen.queryByText(guest.name)).toBeNull();
  rerender(<ScanResultPanel state="unavailable" guest={guest} />);
  expect(screen.queryByText(guest.name)).toBeNull();
});
it("shows prior admission identity and an unassigned table fallback", () => {
  render(
    <ScanResultPanel
      state="already_used"
      guest={{ ...guest, admittedSoFar: 4, tableNumber: null }}
    />,
  );
  expect(screen.getByText("Table not assigned")).toBeTruthy();
  expect(screen.getByText(/Gate lead · Gate 1/)).toBeTruthy();
});
it("uses singular copy for the last remaining place", () => {
  render(<ScanResultPanel state="valid" guest={{ ...guest, admittedSoFar: 3 }} />);
  expect(screen.getByText("1 place remaining")).toBeTruthy();
});
it("labels missing legacy provenance honestly", () => {
  render(
    <ScanResultPanel state="already_used" guest={{ ...guest, admittedSoFar: 4, admissions: [] }} />,
  );
  expect(screen.getByText(/Earlier arrival details are unavailable/)).toBeTruthy();
});
