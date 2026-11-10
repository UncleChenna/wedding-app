// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ManualGuestSearch, type ManualLookup } from "../components/manual-guest-search";
const id = "550e8400-e29b-41d4-a716-446655440000";
const matches = {
  response: {
    state: "matches" as const,
    matches: [{ invitationId: id, name: "Ada & Chidi", matchedName: "Ife Ada" }],
    hasMore: false,
  },
  cached: false,
};
afterEach(cleanup);
it("searches tag-along names and keeps cached selection read-only after connectivity returns", async () => {
  const lookup = vi
    .fn<ManualLookup>()
    .mockResolvedValueOnce(matches)
    .mockResolvedValueOnce({
      cached: true,
      response: {
        state: "selection",
        invitationId: id,
        version: 1,
        result: {
          state: "valid",
          guest: {
            name: "Ada & Chidi",
            partySize: 3,
            admittedSoFar: 1,
            tableNumber: 7,
            admissions: [],
          },
        },
      },
    });
  render(<ManualGuestSearch lookup={lookup} onClose={() => {}} onAdmissionRecorded={() => {}} />);
  fireEvent.change(screen.getByLabelText("Guest name"), { target: { value: "Ife" } });
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Find guest" })));
  expect(screen.getByText("Matched name: Ife Ada")).toBeTruthy();
  await act(async () => fireEvent.click(screen.getByRole("button", { name: /Ada & Chidi/ })));
  expect(lookup.mock.calls[1]?.[0]).toEqual({ operation: "read", invitationId: id });
  expect(screen.queryByRole("button", { name: /Admit/ })).toBeNull();
  expect(screen.getByText(/No entry is recorded/)).toBeTruthy();
  await act(async () => window.dispatchEvent(new Event("online")));
  expect(screen.queryByRole("button", { name: /Admit/ })).toBeNull();
});
it("discards an older name response after the operator changes the query", async () => {
  let finish: ((value: Awaited<ReturnType<ManualLookup>>) => void) | undefined;
  const lookup = vi.fn<ManualLookup>(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  render(<ManualGuestSearch lookup={lookup} onClose={() => {}} onAdmissionRecorded={() => {}} />);
  fireEvent.change(screen.getByLabelText("Guest name"), { target: { value: "Ada" } });
  fireEvent.click(screen.getByRole("button", { name: "Find guest" }));
  fireEvent.change(screen.getByLabelText("Guest name"), { target: { value: "New name" } });
  await act(async () => finish?.(matches));
  expect(screen.queryByText("Ada & Chidi")).toBeNull();
  expect(lookup.mock.calls[0]?.[1].aborted).toBe(true);
});
