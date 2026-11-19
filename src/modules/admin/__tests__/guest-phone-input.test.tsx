// @vitest-environment jsdom
import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { GuestPhoneInput } from "../components/guest-phone-input";
afterEach(cleanup);
function Form({ initial = "" }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <form aria-label="Guest">
      <GuestPhoneInput label="Guest phone" value={value} onChange={setValue} />
    </form>
  );
}
it("posts one international value while displaying the local number and selectable code", () => {
  render(<Form />);
  expect(screen.getByLabelText("Guest phone country code")).toHaveValue("NG");
  fireEvent.change(screen.getByLabelText("Guest phone", { exact: true }), {
    target: { value: "09160665114" },
  });
  expect(screen.getByLabelText("Guest phone", { exact: true })).toHaveValue("09160665114");
  const form = screen.getByRole("form", { name: "Guest" }) as HTMLFormElement;
  expect(new FormData(form).getAll("memberPhone")).toEqual(["+2349160665114"]);
  const country = screen.getByLabelText("Guest phone country code");
  if (country.tagName === "BUTTON") {
    fireEvent.click(country);
    fireEvent.click(screen.getByRole("option", { name: /United Kingdom/ }));
  } else {
    fireEvent.change(country, { target: { value: "GB" } });
  }
  fireEvent.change(screen.getByLabelText("Guest phone", { exact: true }), {
    target: { value: "07700900123" },
  });
  expect(new FormData(form).getAll("memberPhone")).toEqual(["+447700900123"]);
});
it("prefills saved international numbers without rewriting them as Nigerian", () => {
  render(<Form initial="+447700900123" />);
  expect(screen.getByLabelText("Guest phone country code")).toHaveValue("GB");
  expect(screen.getByLabelText("Guest phone", { exact: true })).toHaveValue("7700900123");
});
