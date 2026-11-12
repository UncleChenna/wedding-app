// @vitest-environment jsdom
import { cleanup, act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { OfflineAdmissionResult } from "../components/offline-admission-result";
const record = vi.hoisted(() => vi.fn());
vi.mock("../browser/offline-queue-client", () => ({ recordOfflineAttempt: record }));
const result = {
  state: "valid" as const,
  guest: {
    name: "Synthetic guest",
    partySize: 2,
    admittedSoFar: 0,
    tableNumber: 1,
    admissions: [],
  },
};
beforeEach(() => {
  record.mockReset();
});
afterEach(cleanup);
it("does not show saved admission until durable confirmation and focuses the receipt", async () => {
  let resolve: (value: unknown) => void = () => {};
  record.mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  const onRecorded = vi.fn();
  render(
    <OfflineAdmissionResult
      result={result}
      qr="signed"
      session={"a".repeat(64)}
      onBusyChange={() => {}}
      onRecorded={onRecorded}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Save offline entry" }));
  expect(screen.queryByText("Entry saved on this phone")).not.toBeInTheDocument();
  expect(onRecorded).not.toHaveBeenCalled();
  await act(async () =>
    resolve({
      state: "recorded",
      clientEventId: record.mock.calls[0]?.[0].clientEventId,
      people: 2,
      result: "valid",
    }),
  );
  expect(await screen.findByText("Entry saved on this phone")).toBeInTheDocument();
  expect(onRecorded).toHaveBeenCalledOnce();
  expect(screen.queryByText(/Waiting to sync with the gate records/)).not.toBeInTheDocument();
  expect(screen.getByText(/Check the sync status below/)).toBeInTheDocument();
  await waitFor(() => expect(screen.getByRole("status")).toHaveFocus());
});
it("retries uncertainty with the exact UUID and count and never changes to a live receipt", async () => {
  record.mockResolvedValueOnce({ state: "unavailable" }).mockImplementationOnce(async (input) => ({
    state: "duplicate",
    clientEventId: input.clientEventId,
    result: "valid",
    people: input.people,
  }));
  render(
    <OfflineAdmissionResult
      result={result}
      qr="signed"
      session={"a".repeat(64)}
      onBusyChange={() => {}}
      onRecorded={() => {}}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Save offline entry" }));
  fireEvent.click(await screen.findByRole("button", { name: "Retry this entry" }));
  expect(await screen.findByText("This entry was already saved")).toBeInTheDocument();
  expect(record.mock.calls[1]?.[0]).toEqual(record.mock.calls[0]?.[0]);
  expect(screen.getByText(/Do not admit this group again/)).toBeInTheDocument();
});
it("submits an explicit manual selection without manufacturing a QR", async () => {
  record.mockImplementationOnce(async (input) => ({
    state: "recorded",
    clientEventId: input.clientEventId,
    result: "valid",
    people: input.people,
  }));
  render(
    <OfflineAdmissionResult
      result={result}
      qr={null}
      manualInvitationId="22222222-2222-4222-8222-222222222222"
      session={"a".repeat(64)}
      onBusyChange={() => {}}
      onRecorded={() => {}}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Save offline entry" }));
  expect(await screen.findByText("Entry saved on this phone")).toBeInTheDocument();
  expect(record.mock.calls[0]?.[0]).toMatchObject({
    inputMethod: "manual",
    invitationId: "22222222-2222-4222-8222-222222222222",
  });
  expect(record.mock.calls[0]?.[0]).not.toHaveProperty("qr");
});
