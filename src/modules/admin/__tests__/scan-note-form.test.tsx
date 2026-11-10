// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
const action = vi.hoisted(() => vi.fn());
vi.mock("../server/scan-note-action", () => ({ saveScanNoteAction: action }));
import { ScanNoteForm } from "../components/scan-note-form";
afterEach(() => {
  cleanup();
  action.mockReset();
});
it("keeps a network failure recoverable with the original request identity", async () => {
  action.mockRejectedValue(new Error("synthetic network failure"));
  const view = render(<ScanNoteForm eventId="event-id" requestId="request-id" />);
  fireEvent.change(screen.getByLabelText("Resolution note"), { target: { value: "reviewed" } });
  const form = view.container.querySelector("form");
  if (!form) throw new Error("Missing note form");
  await act(async () => {
    fireEvent.submit(form);
  });
  expect(screen.getByRole("alert")).toHaveTextContent("Please try again");
  expect(screen.getByLabelText("Resolution note")).toHaveValue("reviewed");
  expect(new FormData(form).get("requestId")).toBe("request-id");
});

it("keeps the same retry identity and chosen note after a recoverable error", async () => {
  action.mockResolvedValue({
    ok: false,
    message: "Your note couldn't be saved. Please try again.",
  });
  const view = render(<ScanNoteForm eventId="event-id" requestId="request-id" />);
  fireEvent.change(screen.getByLabelText("Resolution note"), { target: { value: "reviewed" } });
  const form = view.container.querySelector("form");
  if (!form) throw new Error("Missing note form");
  await act(async () => {
    fireEvent.submit(form);
  });
  expect(screen.getByRole("alert")).toHaveTextContent("Your note couldn't be saved");
  expect(screen.getByLabelText("Resolution note")).toHaveValue("reviewed");
  expect(new FormData(form).get("requestId")).toBe("request-id");
  expect(screen.getByRole("button", { name: "Add note" })).toBeEnabled();
});
it("disables repeated submission while pending and reports successful persistence", async () => {
  let finish: (result: { ok: boolean; message: string }) => void = () => {
    throw new Error("Not started");
  };
  action.mockImplementation(
    () =>
      new Promise<{ ok: boolean; message: string }>((resolve) => {
        finish = resolve;
      }),
  );
  const view = render(<ScanNoteForm eventId="event-id" requestId="request-id" />);
  fireEvent.change(screen.getByLabelText("Resolution note"), { target: { value: "explained" } });
  const form = view.container.querySelector("form");
  if (!form) throw new Error("Missing note form");
  await act(async () => {
    fireEvent.submit(form);
  });
  expect(screen.getByRole("button", { name: "Saving note…" })).toBeDisabled();
  expect(screen.getByLabelText("Resolution note")).toBeDisabled();
  await act(async () => {
    finish({ ok: true, message: "Note saved. Original scan evidence is unchanged." });
  });
  expect(screen.getByRole("status")).toHaveTextContent("Original scan evidence is unchanged");
  expect(screen.getByRole("button", { name: "Add note" })).toBeEnabled();
});
