// @vitest-environment jsdom
import { renderToString } from "react-dom/server";
import { useState } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { Select } from "../components/ui/select";
afterEach(cleanup);
function Options() {
  return (
    <>
      <option value="">Choose</option>
      <option value="ng">Nigeria</option>
      <option value="gb">United Kingdom</option>
      <option value="off" disabled>
        Unavailable
      </option>
    </>
  );
}
it("opens a custom list and posts the selected value once", () => {
  render(
    <form aria-label="Test">
      <Select label="Country" name="country" defaultValue="ng">
        {Options()}
      </Select>
    </form>,
  );
  const control = screen.getByRole("combobox", { name: "Country" });
  expect(control.tagName).toBe("BUTTON");
  fireEvent.click(control);
  fireEvent.click(screen.getByRole("option", { name: "United Kingdom" }));
  expect(control).toHaveTextContent("United Kingdom");
  expect(
    new FormData(screen.getByRole("form", { name: "Test" }) as HTMLFormElement).getAll("country"),
  ).toEqual(["gb"]);
});
it("supports arrows, disabled options, Escape and typeahead without premature selection", () => {
  const onChange = vi.fn();
  render(
    <Select label="Country" defaultValue="ng" onChange={onChange}>
      {Options()}
    </Select>,
  );
  const control = screen.getByRole("combobox");
  control.focus();
  fireEvent.keyDown(control, { key: "ArrowDown" });
  fireEvent.keyDown(control, { key: "ArrowDown" });
  expect(onChange).not.toHaveBeenCalled();
  fireEvent.keyDown(control, { key: "Escape" });
  expect(control).toHaveTextContent("Nigeria");
  fireEvent.keyDown(control, { key: "u" });
  fireEvent.keyDown(control, { key: "Enter" });
  expect(control).toHaveTextContent("United Kingdom");
  expect(onChange).toHaveBeenCalledOnce();
  fireEvent.click(control);
  fireEvent.click(screen.getByRole("option", { name: "Unavailable" }));
  expect(onChange).toHaveBeenCalledOnce();
});
it("honors a disabled fieldset and restores an uncontrolled default on reset", async () => {
  const { rerender } = render(
    <form aria-label="Test">
      <fieldset disabled>
        <Select label="Country" name="country" defaultValue="ng">
          {Options()}
        </Select>
      </fieldset>
    </form>,
  );
  fireEvent.click(screen.getByRole("combobox"));
  expect(screen.queryByRole("listbox")).toBeNull();
  rerender(
    <form aria-label="Test">
      <fieldset>
        <Select label="Country" name="country" defaultValue="ng">
          {Options()}
        </Select>
      </fieldset>
    </form>,
  );
  fireEvent.click(screen.getByRole("combobox"));
  fireEvent.click(screen.getByRole("option", { name: "United Kingdom" }));
  fireEvent.reset(screen.getByRole("form", { name: "Test" }));
  (screen.getByRole("form", { name: "Test" }) as HTMLFormElement).reset();
  await waitFor(() => expect(screen.getByRole("combobox")).toHaveTextContent("Nigeria"));
});
it("updates controlled values and exposes required validation on the visible control", () => {
  function Form() {
    const [value, setValue] = useState("");
    return (
      <form aria-label="Test">
        <Select
          label="Country"
          name="country"
          required
          value={value}
          onChange={(e) => setValue(e.target.value)}
        >
          {Options()}
        </Select>
      </form>
    );
  }
  const { container } = render(<Form />);
  const native = container.querySelector("select");
  if (!native) throw Error("Missing form bridge");
  fireEvent.invalid(native);
  expect(screen.getByRole("combobox")).toHaveFocus();
  expect(screen.getByText("Choose an option.")).toBeVisible();
  fireEvent.click(screen.getByRole("combobox"));
  fireEvent.click(screen.getByRole("option", { name: "Nigeria" }));
  expect(screen.getByRole("combobox")).toHaveTextContent("Nigeria");
  expect(screen.queryByText("Choose an option.")).toBeNull();
});

it("keeps fallback labels, errors and sizing accessible before hydration", () => {
  const container = document.createElement("div");
  container.innerHTML = renderToString(
    <Select id="fallback" label="Country" hint="Pick one" error="Required">
      {Options()}
    </Select>,
  );
  const native = container.querySelector("select");
  if (!native) throw new Error("Missing fallback");
  expect(native.hidden).toBe(false);
  expect(native).toHaveAttribute("aria-invalid", "true");
  expect(native).toHaveAttribute("aria-describedby", "fallback-hint fallback-error");
  expect(native).toHaveClass("min-h-11", "w-full", "border-danger");
  expect(container.querySelector("label")).toHaveAttribute("for", native.id);
});
it("shows a compact selected label while keeping full menu labels", () => {
  render(
    <Select label="Country">
      <option value="ng" data-display="+234">
        +234 · Nigeria
      </option>
    </Select>,
  );
  const control = screen.getByRole("combobox");
  expect(control).toHaveTextContent("+234");
  expect(control).not.toHaveTextContent("Nigeria");
  fireEvent.click(control);
  expect(screen.getByRole("option", { name: /Nigeria/ })).toBeVisible();
});
