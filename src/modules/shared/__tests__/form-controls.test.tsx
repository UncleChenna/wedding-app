// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  Checkbox,
  Field,
  Input,
  QuantityStepper,
  RadioGroup,
  Select,
  Textarea,
} from "../components/ui";

/** Shared contract: labelled, invalid state flagged, hint and error linked, error announced. */
function expectErrorContract(control: HTMLElement, hint: string, error: string) {
  expect(control).toHaveAttribute("aria-invalid", "true");
  expect(control).toHaveAccessibleDescription(`${hint} ${error}`);
  const message = screen.getByText(error);
  expect(message.closest("[aria-live]")).toHaveAttribute("aria-live", "polite");
}

describe("Input and Field", () => {
  it("Input follows the same contract, including the announced error", () => {
    render(<Input label="Table number" hint="On your place card" error="Unknown table" />);
    expectErrorContract(
      screen.getByRole("textbox", { name: "Table number" }),
      "On your place card",
      "Unknown table",
    );
  });

  it("Field wires a custom control to its label, hint and error", () => {
    render(
      <Field label="Seat" hint="Optional" error="Seat taken">
        {(control) => <input {...control} />}
      </Field>,
    );
    expectErrorContract(screen.getByRole("textbox", { name: "Seat" }), "Optional", "Seat taken");
  });
});

describe("Textarea", () => {
  it("is labelled, links hint and error, and is at least 44px tall", () => {
    render(
      <Textarea label="Note for the kitchen" hint="Allergies, spice level" error="Keep it short" />,
    );
    const control = screen.getByRole("textbox", { name: "Note for the kitchen" });
    expectErrorContract(control, "Allergies, spice level", "Keep it short");
    expect(control).toHaveClass("min-h-28");
  });

  it("has no invalid state without an error", () => {
    render(<Textarea label="Note" />);
    expect(screen.getByRole("textbox", { name: "Note" })).not.toHaveAttribute("aria-invalid");
  });
});

describe("Select", () => {
  it("is labelled, links hint and error, and is 44px tall", () => {
    render(
      <Select label="Meal" hint="Choose one" error="Pick a meal">
        <option value="">Choose…</option>
        <option value="jollof">Jollof rice</option>
      </Select>,
    );
    const control = screen.getByRole("combobox", { name: "Meal" });
    expectErrorContract(control, "Choose one", "Pick a meal");
    expect(control).toHaveClass("min-h-11");
  });
});

describe("Checkbox", () => {
  it("is labelled, has a 44px tap row and links its error", () => {
    render(
      <Checkbox label="I'm vegetarian" hint="We'll tell the kitchen" error="Please confirm" />,
    );
    const control = screen.getByRole("checkbox", { name: "I'm vegetarian" });
    expectErrorContract(control, "We'll tell the kitchen", "Please confirm");
    expect(control.closest("label")).toHaveClass("min-h-11");
    fireEvent.click(screen.getByText("I'm vegetarian"));
    expect(control).toBeChecked();
  });
});

describe("RadioGroup", () => {
  const options = [
    { value: "yes", label: "Count me in" },
    { value: "no", label: "I'll be there in spirit" },
  ];

  it("names the group with a legend and labels every option", () => {
    render(<RadioGroup name="rsvp" legend="Will you join us?" options={options} />);
    expect(screen.getByRole("radiogroup", { name: "Will you join us?" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Count me in" })).toBeInTheDocument();
    for (const radio of screen.getAllByRole("radio"))
      expect(radio.closest("label")).toHaveClass("min-h-11");
  });

  it("flags the group invalid and links hint and error (ARIA allows aria-invalid on radiogroup, not radio)", () => {
    render(
      <RadioGroup
        name="rsvp"
        legend="Will you join us?"
        options={options}
        hint="You can change this later"
        error="Please choose one"
      />,
    );
    const group = screen.getByRole("radiogroup", { name: "Will you join us?" });
    expectErrorContract(group, "You can change this later", "Please choose one");
    for (const radio of screen.getAllByRole("radio"))
      expect(radio).not.toHaveAttribute("aria-invalid");
  });

  it("reports the chosen value", () => {
    const onValueChange = vi.fn();
    render(
      <RadioGroup
        name="rsvp"
        legend="Will you join us?"
        options={options}
        onValueChange={onValueChange}
      />,
    );
    fireEvent.click(screen.getByRole("radio", { name: "I'll be there in spirit" }));
    expect(onValueChange).toHaveBeenCalledWith("no");
  });
});

describe("QuantityStepper", () => {
  it("is labelled, 44px, and its buttons say what they change", () => {
    render(<QuantityStepper label="Jollof rice" defaultValue={1} />);
    const input = screen.getByRole("spinbutton", { name: "Jollof rice" });
    expect(input).toHaveValue(1);
    expect(screen.getByRole("button", { name: "Decrease Jollof rice" })).toHaveClass("size-11");
    expect(screen.getByRole("button", { name: "Increase Jollof rice" })).toHaveClass("size-11");
  });

  it("respects min and max with the buttons, disabling them at the bounds", () => {
    const onValueChange = vi.fn();
    render(
      <QuantityStepper
        label="Water"
        min={0}
        max={2}
        defaultValue={1}
        onValueChange={onValueChange}
      />,
    );
    const input = screen.getByRole("spinbutton", { name: "Water" });
    const increase = screen.getByRole("button", { name: "Increase Water" });
    const decrease = screen.getByRole("button", { name: "Decrease Water" });
    fireEvent.click(increase);
    expect(input).toHaveValue(2);
    expect(increase).toBeDisabled();
    fireEvent.click(decrease);
    fireEvent.click(decrease);
    expect(input).toHaveValue(0);
    expect(decrease).toBeDisabled();
    expect(onValueChange).toHaveBeenLastCalledWith(0);
  });

  it("is keyboard operable with arrows, Home and End, and clamps typed values", () => {
    render(<QuantityStepper label="Chicken" min={1} max={5} defaultValue={2} />);
    const input = screen.getByRole("spinbutton", { name: "Chicken" });
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(input).toHaveValue(3);
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(input).toHaveValue(2);
    fireEvent.keyDown(input, { key: "End" });
    expect(input).toHaveValue(5);
    fireEvent.keyDown(input, { key: "Home" });
    expect(input).toHaveValue(1);
    fireEvent.change(input, { target: { value: "40" } });
    fireEvent.blur(input);
    expect(input).toHaveValue(5);
  });

  it("steps from the typed draft and forwards input props", () => {
    render(
      <QuantityStepper label="Meals" defaultValue={1} max={5} className="custom-input" required />,
    );
    const input = screen.getByRole("spinbutton", { name: "Meals" });
    expect(input).toBeRequired();
    expect(input).toHaveClass("custom-input");
    fireEvent.change(input, { target: { value: "3" } });
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(input).toHaveValue(4);
    fireEvent.change(input, { target: { value: "3" } });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(input).toHaveValue(2);
  });

  it("returns focus to the input when either button reaches its bound", () => {
    render(<QuantityStepper label="Meals" defaultValue={1} max={2} />);
    const input = screen.getByRole("spinbutton", { name: "Meals" });
    const plus = screen.getByRole("button", { name: "Increase Meals" });
    const minus = screen.getByRole("button", { name: "Decrease Meals" });
    plus.focus();
    fireEvent.click(plus);
    expect(input).toHaveFocus();
    minus.focus();
    fireEvent.click(minus);
    expect(minus).toHaveFocus();
    fireEvent.click(minus);
    expect(input).toHaveFocus();
    expect(input).toHaveValue(0);
  });

  it("links hint and error like every other control", () => {
    render(<QuantityStepper label="Chicken" hint="Max 5 per order" error="Too many" />);
    expectErrorContract(
      screen.getByRole("spinbutton", { name: "Chicken" }),
      "Max 5 per order",
      "Too many",
    );
  });
});
