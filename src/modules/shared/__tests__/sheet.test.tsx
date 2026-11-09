// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { Sheet } from "../components/ui/sheet";

const originals = ["showModal", "close"].map((name) => ({
  name,
  descriptor: Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, name),
}));
beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.setAttribute("open", "");
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.removeAttribute("open");
    },
  });
});
afterEach(() => {
  for (const { name, descriptor } of originals) {
    if (descriptor) Object.defineProperty(HTMLDialogElement.prototype, name, descriptor);
    else Reflect.deleteProperty(HTMLDialogElement.prototype, name);
  }
});

it("synchronizes Escape through controlled state before the native close event", () => {
  const change = vi.fn();
  render(<Sheet open onOpenChange={change} title="Review invitation" />);
  const event = new Event("cancel", { bubbles: false, cancelable: true });
  fireEvent(screen.getByRole("dialog"), event);
  expect(event.defaultPrevented).toBe(true);
  expect(change).toHaveBeenCalledWith(false);
});

it("ignores an old queued close event after the dialog has reopened", () => {
  const change = vi.fn();
  const { rerender } = render(<Sheet open onOpenChange={change} title="Review invitation" />);
  const dialog = screen.getByRole("dialog");
  rerender(<Sheet open={false} onOpenChange={change} title="Review invitation" />);
  rerender(<Sheet open onOpenChange={change} title="Review invitation" />);
  fireEvent(dialog, new Event("close"));
  expect(change).not.toHaveBeenCalled();
  expect(dialog).toHaveAttribute("open");
});

it("still reports a native close when the dialog is actually closed", () => {
  const change = vi.fn();
  render(<Sheet open onOpenChange={change} title="Review invitation" />);
  const dialog = screen.getByRole("dialog");
  dialog.removeAttribute("open");
  fireEvent(dialog, new Event("close"));
  expect(change).toHaveBeenCalledWith(false);
});
