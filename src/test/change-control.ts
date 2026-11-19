import { fireEvent } from "@testing-library/react";

/** Select through the custom listbox; text inputs retain their normal input event. */
export function changeControl(control: HTMLElement, event: { target: { value: string } }) {
  if (control.getAttribute("role") !== "combobox") return fireEvent.change(control, event);
  fireEvent.click(control);
  const list = document.getElementById(control.getAttribute("aria-controls") ?? "");
  const option = Array.from(list?.querySelectorAll<HTMLElement>('[role="option"]') ?? []).find(
    (row) => row.dataset.value === event.target.value,
  );
  if (!option) throw new Error(`No dropdown option: ${event.target.value}`);
  fireEvent.click(option);
}
