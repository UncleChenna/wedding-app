// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Button, Input, ToastProvider, useToast } from "../components/ui";

describe("Button", () => {
  it("defaults to type=button and is disabled while loading", () => {
    render(<Button loading>Save</Button>);
    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toHaveAttribute("type", "button");
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });

  it("uses token classes for each variant", () => {
    render(<Button variant="danger">Delete</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-danger", "text-danger-foreground");
  });
});

describe("Input", () => {
  it("links label, hint and error for screen readers", () => {
    render(<Input label="Table number" hint="On your place card" error="Unknown table" />);
    const input = screen.getByLabelText("Table number");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("On your place card Unknown table");
  });
});

describe("Toast", () => {
  function Trigger() {
    const { toast } = useToast();
    return <button onClick={() => toast({ title: "Order sent", duration: 1000 })}>go</button>;
  }

  it("announces a toast and auto-dismisses it", () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByText("go"));
    expect(screen.getByRole("status")).toHaveTextContent("Order sent");
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByRole("status")).not.toHaveTextContent("Order sent");
    vi.useRealTimers();
  });

  it("throws a clear error outside the provider", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Trigger />)).toThrow(/inside <ToastProvider>/);
  });
});
