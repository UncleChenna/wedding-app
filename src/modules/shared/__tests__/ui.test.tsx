// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  Input,
  ToastProvider,
  ToastView,
  useToast,
} from "../components/ui";

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

describe("Button hardening (TICKET-017)", () => {
  it.each(["sm", "md", "lg"] as const)("%s keeps a 44×44px minimum tap target", (size) => {
    render(<Button size={size}>Go</Button>);
    const button = screen.getByRole("button", { name: "Go" });
    expect(button.className).toMatch(/\bmin-h-(11|13)\b/);
    expect(button).toHaveClass("min-w-11");
  });

  it("is a native, focusable button with a visible focus ring", () => {
    render(<Button>Focus me</Button>);
    const button = screen.getByRole("button", { name: "Focus me" });
    button.focus();
    expect(button).toHaveFocus();
    expect(button).toHaveClass("focus-visible:outline-ring");
  });

  it("stops the loading spinner under reduced motion", () => {
    const { container } = render(<Button loading>Saving</Button>);
    expect(container.querySelector(".animate-spin")).toHaveClass("motion-reduce:animate-none");
  });
});

describe("Toast hardening (TICKET-017)", () => {
  function Trigger({ tone }: { tone: "success" | "danger" | "default" }) {
    const { toast } = useToast();
    return <button onClick={() => toast({ title: "Heads up", tone, duration: 0 })}>go</button>;
  }

  it("labels success and error toasts with text and an icon, not colour alone", () => {
    render(<ToastView title="Checked in" tone="success" />);
    expect(screen.getByText("Success:")).toHaveClass("sr-only");
    expect(document.querySelector("svg[data-tone-icon='success']")).toBeInTheDocument();
    render(<ToastView title="Not found" tone="danger" />);
    expect(screen.getByText("Error:")).toHaveClass("sr-only");
    expect(document.querySelector("svg[data-tone-icon='danger']")).toBeInTheDocument();
  });

  it("announces errors assertively and other toasts politely", () => {
    render(
      <ToastProvider>
        <Trigger tone="danger" />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByText("go"));
    expect(screen.getByRole("alert")).toHaveTextContent("Heads up");
    expect(screen.getByRole("status")).not.toHaveTextContent("Heads up");
  });

  it("has a labelled, 44px dismiss button", () => {
    render(
      <ToastProvider>
        <Trigger tone="default" />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByText("go"));
    const dismiss = screen.getByRole("button", { name: "Dismiss notification" });
    expect(dismiss).toHaveClass("size-11");
    fireEvent.click(dismiss);
    expect(screen.getByRole("status")).not.toHaveTextContent("Heads up");
  });
});

describe("Card and Input semantics (TICKET-017)", () => {
  it("gives a card a real heading so screen readers can navigate by it", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Kindly reply</CardTitle>
        </CardHeader>
      </Card>,
    );
    expect(screen.getByRole("heading", { name: "Kindly reply" })).toBeInTheDocument();
  });

  it("is keyboard focusable, 44px tall and named by its label", () => {
    render(<Input label="Table number" />);
    const input = screen.getByRole("textbox", { name: "Table number" });
    input.focus();
    expect(input).toHaveFocus();
    expect(input).toHaveClass("min-h-11", "focus-visible:outline-ring");
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
