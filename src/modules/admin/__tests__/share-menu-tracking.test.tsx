// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeAll, beforeEach, expect, it, vi } from "vitest";
import { ToastProvider } from "@/modules/shared/components/ui";
const actions = vi.hoisted(() => ({ record: vi.fn(), undo: vi.fn() }));
vi.mock("../server/share-tracking-actions", () => ({
  recordShareAction: actions.record,
  undoShareAction: actions.undo,
}));
import { ShareMenu } from "../components/share-menu";
const tracking = { invitationId: "df4d9ce9-57e3-440a-b0b6-4be74b2b78d4", expectedVersion: 2 };
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
});
beforeEach(() => {
  actions.record.mockReset().mockResolvedValue({ ok: true, eventId: "event" });
  actions.undo.mockReset().mockResolvedValue({ ok: true });
});
function setup() {
  render(
    <ToastProvider>
      <ShareMenu
        invitation={{
          url: "https://example.test/i/secret",
          subject: "Invitation",
          message: "Join us",
        }}
        tracking={tracking}
      />
    </ToastProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Share invitation" }));
}
it("opening the menu and cancelling native share never records sent", async () => {
  const share = vi.fn().mockRejectedValue(new DOMException("Cancelled", "AbortError"));
  Object.defineProperty(navigator, "share", { configurable: true, value: share });
  setup();
  expect(actions.record).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "More ways to share" }));
  await waitFor(() => expect(share).toHaveBeenCalledOnce());
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "More ways to share" })).toBeEnabled(),
  );
  expect(actions.record).not.toHaveBeenCalled();
});
it("records successful copying and supports undo without claiming recall", async () => {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
  setup();
  fireEvent.click(screen.getByRole("button", { name: "Copy link" }));
  await waitFor(() =>
    expect(actions.record).toHaveBeenCalledWith(
      expect.objectContaining({ ...tracking, channel: "copy", requestId: expect.any(String) }),
    ),
  );
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Undo sharing record" })).toBeEnabled(),
  );
  fireEvent.click(screen.getByRole("button", { name: "Undo sharing record" }));
  await waitFor(() =>
    expect(actions.undo).toHaveBeenCalledWith({
      invitationId: tracking.invitationId,
      eventId: "event",
    }),
  );
  await waitFor(() =>
    expect(screen.getByText(/Messages already sent are not recalled/)).toBeVisible(),
  );
  expect(screen.getByText(/Messages already sent are not recalled/)).toHaveFocus();
});
it("records successful native share separately from external delivery", async () => {
  Object.defineProperty(navigator, "share", {
    configurable: true,
    value: vi.fn().mockResolvedValue(undefined),
  });
  setup();
  fireEvent.click(screen.getByRole("button", { name: "More ways to share" }));
  await waitFor(() =>
    expect(actions.record).toHaveBeenCalledWith(expect.objectContaining({ channel: "native" })),
  );
  expect(screen.getByText(/does not confirm delivery/)).toBeVisible();
});

it.each([
  ["WhatsApp", "whatsapp"],
  ["Email", "email"],
])("records %s as an attempt rather than delivery", async (label, channel) => {
  setup();
  const link = screen.getByRole("link", { name: label });
  link.addEventListener("click", (event) => event.preventDefault());
  fireEvent.click(link);
  await waitFor(() =>
    expect(actions.record).toHaveBeenCalledWith(expect.objectContaining({ channel })),
  );
  expect(screen.getByText(/does not confirm delivery/)).toBeInTheDocument();
});
it("failed recording is disclosed and never offers a false Undo", async () => {
  actions.record.mockResolvedValue({ ok: false, message: "Sharing could not be recorded." });
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
  setup();
  fireEvent.click(screen.getByRole("button", { name: "Copy link" }));
  await waitFor(() => expect(screen.getByText("Sharing could not be recorded.")).toBeVisible());
  expect(screen.queryByRole("button", { name: "Undo sharing record" })).toBeNull();
});
