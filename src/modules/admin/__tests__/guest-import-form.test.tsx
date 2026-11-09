// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { GuestImportForm } from "../components/guest-import-form";
import type { ImportPreviewViewResult } from "../lib/guest-import-view";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
const approved: ImportPreviewViewResult = {
  status: "preview",
  id: "preview-1",
  digest: "digest-1",
  expiresAt: "2099-12-19T00:00:00Z",
  invitationCount: 1,
  guestCount: 2,
  households: [
    {
      key: "row-2",
      heading: "Ada household",
      members: ["Ada", "Uchenna"],
      partyLimit: 3,
      side: "Family",
      table: "Table 4",
    },
  ],
};
function pick(name = "guests.csv") {
  fireEvent.change(screen.getByLabelText("Guest CSV file"), {
    target: { files: [new File(["name,email"], name, { type: "text/csv" })] },
  });
}
it("shows row errors without an import action or writes", async () => {
  const commit = vi.fn();
  render(
    <GuestImportForm
      readFile={async () => "bad csv"}
      previewAction={async () => ({
        status: "error",
        message: "Correct these rows.",
        errors: [{ row: 3, column: "email", message: "Enter a valid email." }],
      })}
      commitAction={commit}
    />,
  );
  pick();
  fireEvent.click(screen.getByRole("button", { name: "Preview guests" }));
  await screen.findByText("Row 3 · email: Enter a valid email.");
  expect(screen.queryByRole("button", { name: "Import guests" })).not.toBeInTheDocument();
  expect(commit).not.toHaveBeenCalled();
  expect(screen.getByRole("alert")).toHaveFocus();
});
it("requires confirmation, sends only the approved identity, and reports a replay without duplicate claims", async () => {
  const commit = vi.fn().mockResolvedValue({ status: "committed", count: 1, replayed: true });
  render(
    <GuestImportForm
      readFile={async () => "csv"}
      previewAction={async () => approved}
      commitAction={commit}
    />,
  );
  pick();
  fireEvent.click(screen.getByRole("button", { name: "Preview guests" }));
  await screen.findByRole("button", { name: "Import guests" });
  expect(commit).not.toHaveBeenCalled();
  expect(screen.getByText("Ada household")).toBeInTheDocument();
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Import guests" })).not.toBeDisabled(),
  );
  fireEvent.click(screen.getByRole("button", { name: "Import guests" }));
  await screen.findByText(
    "This import was already completed. No duplicate invitations were added.",
  );
  expect(commit).toHaveBeenCalledWith({ previewId: "preview-1", digest: "digest-1" });
});
it("invalidates an approved preview as soon as a new file is selected", async () => {
  render(
    <GuestImportForm
      readFile={async () => "csv"}
      previewAction={async () => approved}
      commitAction={vi.fn()}
    />,
  );
  pick();
  fireEvent.click(screen.getByRole("button", { name: "Preview guests" }));
  await screen.findByRole("button", { name: "Import guests" });
  pick("corrected.csv");
  expect(screen.queryByRole("button", { name: "Import guests" })).not.toBeInTheDocument();
  expect(screen.queryByText("Ada household")).not.toBeInTheDocument();
});
it("ignores a delayed preview response for a replaced file", async () => {
  let resolve: (value: ImportPreviewViewResult) => void = () => {};
  const waiting = new Promise<ImportPreviewViewResult>((done) => {
    resolve = done;
  });
  render(
    <GuestImportForm
      readFile={async () => "csv"}
      previewAction={() => waiting}
      commitAction={vi.fn()}
    />,
  );
  pick();
  fireEvent.click(screen.getByRole("button", { name: "Preview guests" }));
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Preview guests" })).toBeDisabled(),
  );
  pick("replacement.csv");
  resolve(approved);
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Preview guests" })).not.toBeDisabled(),
  );
  expect(screen.queryByRole("button", { name: "Import guests" })).not.toBeInTheDocument();
});
it("discards an expired/stale commit and requires a fresh preview", async () => {
  render(
    <GuestImportForm
      readFile={async () => "csv"}
      previewAction={async () => approved}
      commitAction={async () => ({
        status: "error",
        message: "The preview changed. Preview the file again.",
      })}
    />,
  );
  pick();
  fireEvent.click(screen.getByRole("button", { name: "Preview guests" }));
  await screen.findByRole("button", { name: "Import guests" });
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Import guests" })).not.toBeDisabled(),
  );
  fireEvent.click(screen.getByRole("button", { name: "Import guests" }));
  await screen.findByText("The preview changed. Preview the file again.");
  expect(screen.queryByRole("button", { name: "Import guests" })).not.toBeInTheDocument();
});
it("hides unexpected read failures and never sends an unreadable file", async () => {
  const preview = vi.fn();
  render(
    <GuestImportForm
      readFile={async () => {
        throw new Error("private failure");
      }}
      previewAction={preview}
      commitAction={vi.fn()}
    />,
  );
  pick();
  fireEvent.click(screen.getByRole("button", { name: "Preview guests" }));
  await screen.findByText("We couldn't read this file. Save it as a UTF-8 CSV and try again.");
  expect(preview).not.toHaveBeenCalled();
  expect(screen.queryByText("private failure")).not.toBeInTheDocument();
});
it("blocks oversized files before reading or requesting a preview", async () => {
  const readFile = vi.fn();
  const previewAction = vi.fn();
  render(
    <GuestImportForm readFile={readFile} previewAction={previewAction} commitAction={vi.fn()} />,
  );
  fireEvent.change(screen.getByLabelText("Guest CSV file"), {
    target: { files: [new File([new Uint8Array(262145)], "too-big.csv")] },
  });
  fireEvent.click(screen.getByRole("button", { name: "Preview guests" }));
  await screen.findByText("Choose a CSV file smaller than 256 KB, with no more than 300 guests.");
  expect(readFile).not.toHaveBeenCalled();
  expect(previewAction).not.toHaveBeenCalled();
});
it("removes expired approval without needing a server round trip", async () => {
  const commit = vi.fn();
  render(
    <GuestImportForm
      readFile={async () => "csv"}
      previewAction={async () => ({ ...approved, expiresAt: "2020-01-01T00:00:00Z" })}
      commitAction={commit}
    />,
  );
  pick();
  fireEvent.click(screen.getByRole("button", { name: "Preview guests" }));
  await screen.findByText("This preview has expired. Preview your file again before importing.");
  expect(screen.queryByRole("button", { name: "Import guests" })).not.toBeInTheDocument();
  expect(commit).not.toHaveBeenCalled();
});

it("keeps an in-flight commit authoritative when the preview expiry time passes", async () => {
  vi.useFakeTimers();
  let resolve: (value: {
    status: "committed";
    count: number;
    replayed: boolean;
  }) => void = () => {};
  const waiting = new Promise<{ status: "committed"; count: number; replayed: boolean }>((done) => {
    resolve = done;
  });
  render(
    <GuestImportForm
      readFile={async () => "csv"}
      previewAction={async () => ({
        ...approved,
        expiresAt: new Date(Date.now() + 1000).toISOString(),
      })}
      commitAction={() => waiting}
    />,
  );
  pick();
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Preview guests" }));
  });
  await act(async () => {
    expect(screen.getByRole("button", { name: "Import guests" })).not.toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Import guests" }));
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1500);
  });
  await act(async () => {
    resolve({ status: "committed", count: 1, replayed: false });
  });
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(screen.getByText("1 draft invitation added.")).toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveFocus();
});
