// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { StrictMode, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  useActionFeedback,
  useFeedbackMessage,
  type ActionFeedbackState,
} from "../components/use-action-feedback";
import { ToastProvider, useToast } from "../components/ui/toast";
import { ConfirmSubmitButton } from "../components/ui/confirm-submit-button";

function Result({ state }: { state: ActionFeedbackState }) {
  useActionFeedback(state);
  return null;
}
function Message({ message }: { message: string }) {
  useFeedbackMessage(message);
  return null;
}
afterEach(() => vi.useRealTimers());
describe("action feedback", () => {
  it("does not announce initial state or replay a result in StrictMode; repeated actions still notify", () => {
    const initial = { status: "saved", message: "Already saved" };
    const view = (state: ActionFeedbackState) => (
      <StrictMode>
        <ToastProvider>
          <Result state={state} />
        </ToastProvider>
      </StrictMode>
    );
    const { rerender } = render(view(initial));
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    const saved = { status: "saved", message: "Settings saved" };
    rerender(view(saved));
    rerender(view(saved));
    expect(screen.getAllByText("Settings saved")).toHaveLength(1);
    rerender(view({ ...saved }));
    expect(screen.getAllByText("Settings saved")).toHaveLength(2);
  });
  it.each(["wrong", "expired", "unauthorized", "too-early", "locked"])(
    "never reports %s as success",
    (status) => {
      const view = (state: ActionFeedbackState) => (
        <ToastProvider>
          <Result state={state} />
        </ToastProvider>
      );
      const { rerender } = render(view({ status: "idle" }));
      rerender(view({ status, message: "Please check and try again" }));
      expect(screen.getByRole("alert")).toHaveTextContent("Please check and try again");
      expect(screen.getByRole("status")).toBeEmptyDOMElement();
    },
  );
  it("keeps failed results visible until dismissed", () => {
    vi.useFakeTimers();
    const view = (state: ActionFeedbackState) => (
      <ToastProvider>
        <Result state={state} />
      </ToastProvider>
    );
    const { rerender } = render(view({ status: "idle" }));
    rerender(view({ ok: false, message: "Please try again" }));
    act(() => vi.advanceTimersByTime(60000));
    expect(screen.getByRole("alert")).toHaveTextContent("Please try again");
    fireEvent.click(screen.getByRole("button", { name: "Dismiss notification" }));
    expect(screen.getByRole("alert")).toBeEmptyDOMElement();
  });
  it("does not repeat unchanged polling messages", () => {
    const view = (message: string) => (
      <ToastProvider>
        <Message message={message} />
      </ToastProvider>
    );
    const { rerender } = render(view(""));
    rerender(view("Updates paused"));
    rerender(view("Updates paused"));
    expect(screen.getAllByText("Updates paused")).toHaveLength(1);
  });
  it("bounds a burst of notifications and removes timers for evicted entries", () => {
    vi.useFakeTimers();
    function Burst() {
      const { toast } = useToast();
      return (
        <button
          onClick={() => {
            for (let i = 1; i <= 5; i++) toast({ title: `Result ${i}` });
          }}
        >
          Send
        </button>
      );
    }
    render(
      <ToastProvider>
        <Burst />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByText("Send"));
    expect(screen.queryByText("Result 1")).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Dismiss notification" })).toHaveLength(3);
    expect(vi.getTimerCount()).toBe(3);
    act(() => vi.advanceTimersByTime(6000));
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });
  it("retains normal inline form rendering without a provider", () => {
    const { rerender } = render(<Result state={{ status: "idle" }} />);
    expect(() => rerender(<Result state={{ status: "saved", message: "Saved" }} />)).not.toThrow();
  });
});

describe("confirmation submit", () => {
  it("cancels without submitting and preserves the original submit button on confirmation", () => {
    Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
      configurable: true,
      value: function (this: HTMLDialogElement) {
        this.setAttribute("open", "");
      },
    });
    Object.defineProperty(HTMLDialogElement.prototype, "close", {
      configurable: true,
      value: function (this: HTMLDialogElement) {
        this.removeAttribute("open");
      },
    });
    const submit = vi
      .spyOn(HTMLFormElement.prototype, "requestSubmit")
      .mockImplementation(() => {});
    function Form() {
      const [value, setValue] = useState("kept");
      return (
        <form>
          <input aria-label="Name" value={value} onChange={(e) => setValue(e.target.value)} />
          <ConfirmSubmitButton
            name="intent"
            value="remove"
            confirmationTitle="Remove item?"
            confirmationDescription="Existing orders stay."
            confirmLabel="Remove now"
          >
            Remove
          </ConfirmSubmitButton>
        </form>
      );
    }
    render(<Form />);
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(submit).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove now" }));
    expect(submit).toHaveBeenCalledTimes(1);
    expect(submit.mock.calls[0]?.[0]).toHaveAttribute("name", "intent");
    expect(submit.mock.calls[0]?.[0]).toHaveAttribute("value", "remove");
    expect(screen.getByLabelText("Name")).toHaveValue("kept");
  });
});
