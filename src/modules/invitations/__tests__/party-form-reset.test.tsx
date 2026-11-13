// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
vi.mock("../server/party-actions", () => ({ updateParty: vi.fn() }));
import { PartyForm } from "../components/party-form";

it("keeps controlled guest choices visible when an action resets its native form", async () => {
  const { container } = render(
    <PartyForm
      token="synthetic"
      details={{
        people: [{ id: "guest", name: "Ada", mealChoice: "", dietaryNotes: "", isPrimary: true }],
        meals: [{ id: "meal", name: "Vegetable rice" }],
        maxTagAlongs: 1,
      }}
    />,
  );
  fireEvent.change(screen.getByLabelText("Meal choice"), { target: { value: "meal" } });
  fireEvent.change(screen.getByLabelText("Dietary notes (optional)"), {
    target: { value: "No nuts" },
  });
  const form = container.querySelector("form");
  if (!form) throw new Error("Party form missing");
  act(() => form.reset());
  expect(screen.getByLabelText("Meal choice")).toHaveValue("meal");
  expect(screen.getByLabelText("Dietary notes (optional)")).toHaveValue("No nuts");
});
