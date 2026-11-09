// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { EventClosureForm } from "../components/event-closure-form";
import { closeEventFormAction } from "../server/event-closure-action";

vi.mock("../server/event-closure-action", () => ({ closeEventFormAction: vi.fn() }));
beforeEach(() => {
  vi.resetAllMocks();
});
it("keeps closure unavailable before the server-supplied cutoff", () => {
  render(<EventClosureForm eventDate="2026-12-19" eligible={false} />);
  expect(screen.getByRole("button", { name: "Close the event" })).toBeDisabled();
  expect(screen.getByLabelText("Type CLOSE EVENT to confirm")).toBeDisabled();
});
it("requires both a typed confirmation and evidence acknowledgment", () => {
  render(<EventClosureForm eventDate="2026-12-19" eligible />);
  const field = screen.getByLabelText("Type CLOSE EVENT to confirm");
  expect(field).toBeRequired();
  expect(field).toHaveAttribute("pattern", "CLOSE EVENT");
  const checkbox = screen.getByRole("checkbox");
  expect(checkbox).toBeRequired();
  expect(checkbox).not.toBeChecked();
});
it("announces success and prevents another submission", async () => {
  vi.mocked(closeEventFormAction).mockResolvedValue({
    status: "closed",
    staffRevoked: 2,
    devicesRevoked: 3,
  });
  render(<EventClosureForm eventDate="2026-12-19" eligible />);
  fireEvent.change(screen.getByLabelText("Type CLOSE EVENT to confirm"), {
    target: { value: "CLOSE EVENT" },
  });
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.submit(screen.getByRole("form", { name: "Close event" }));
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("The event is closed"));
  expect(screen.getByRole("button", { name: "Close the event" })).toBeDisabled();
});
it("announces refusal without claiming closure", async () => {
  vi.mocked(closeEventFormAction).mockResolvedValue({
    status: "event-changed",
    message: "The wedding date changed. Review the event details and confirm again.",
  });
  render(<EventClosureForm eventDate="2026-12-19" eligible />);
  const button = screen.getByRole("button", { name: "Close the event" });
  fireEvent.submit(screen.getByRole("form", { name: "Close event" }));
  await waitFor(() =>
    expect(screen.getByRole("status")).toHaveTextContent("The wedding date changed"),
  );
  expect(button).toBeEnabled();
});
