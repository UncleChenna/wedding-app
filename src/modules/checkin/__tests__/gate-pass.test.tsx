// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GatePass, gatePassCopy } from "../components/gate-pass";

const URL = "https://example.com/p/payload.signature";

describe("GatePass", () => {
  it("shows names, party size, table and the pass QR for a valid pass", () => {
    const { container } = render(
      <GatePass
        passUrl={URL}
        resolution={{
          state: "valid",
          pass: {
            names: ["Ngozi Okafor"],
            householdName: "The Okafor family",
            partySize: 3,
            tableNumber: 12,
          },
        }}
      />,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Ngozi Okafor");
    expect(screen.getByText("The Okafor family")).toBeVisible();
    expect(screen.getByText("3 guests")).toBeVisible();
    expect(screen.getByText("12")).toBeVisible();
    expect(screen.getByRole("img", { name: "Gate pass QR code for Ngozi Okafor" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Back to our day" })).toHaveAttribute("href", "/");
    // Read-only: no form controls and no route into RSVP editing.
    expect(container.querySelector("form, input, button, textarea, select")).toBeNull();
    expect(container.innerHTML).not.toMatch(/href="\/i\//);
  });

  it("says when the table is not assigned yet and handles a single guest", () => {
    render(
      <GatePass
        passUrl={URL}
        resolution={{
          state: "valid",
          pass: { names: [], householdName: "Amara", partySize: 1, tableNumber: null },
        }}
      />,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Amara");
    expect(screen.getByText("1 guest")).toBeVisible();
    expect(screen.getByText("To follow")).toBeVisible();
  });

  it.each(Object.keys(gatePassCopy) as (keyof typeof gatePassCopy)[])(
    "shows a warm, privacy-safe %s state with no QR",
    (state) => {
      const { container } = render(<GatePass passUrl={URL} resolution={{ state }} />);
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        gatePassCopy[state].title,
      );
      expect(screen.getByText(gatePassCopy[state].body)).toBeVisible();
      expect(screen.queryByRole("img")).toBeNull();
      expect(container.textContent).not.toContain("payload.signature");
      expect(container.querySelector("form, input, button")).toBeNull();
    },
  );
});
