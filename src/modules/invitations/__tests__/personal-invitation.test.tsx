// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { defaultEventSettings } from "@/modules/shared/lib/event-settings";
import { PersonalInvitation } from "../components/personal-invitation";
vi.mock("../components/rsvp-form", () => ({
  RsvpForm: () => (
    <form aria-label="Your reply">
      <button>Update reply</button>
    </form>
  ),
}));
it.each([
  ["yes", "Your pass"],
  ["no", "We’ll miss you"],
  [null, null],
] as const)(
  "renders the next step for %s while preserving reply editing",
  (attendance, heading) => {
    render(
      <PersonalInvitation
        invitation={{ attendance, primaryNames: ["Guest"], householdName: null }}
        token="test"
        repliesOpen
        details={defaultEventSettings}
        now={new Date("2026-12-18T12:00:00Z")}
      />,
    );
    expect(screen.getByRole("form", { name: "Your reply" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Back to our day" })).toHaveAttribute("href", "/");
    if (heading) expect(screen.getByRole("heading", { name: heading })).toBeVisible();
    else expect(screen.queryByRole("heading", { name: "Your pass" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Order to your table" })).toBeNull();
  },
);
it.each(["yes", "no", null] as const)(
  "offers ordering on the venue's wedding day for %s",
  (attendance) => {
    render(
      <PersonalInvitation
        invitation={{ attendance, primaryNames: ["Guest"], householdName: null }}
        token="test"
        repliesOpen
        details={{ ...defaultEventSettings, timeZone: "Africa/Lagos" }}
        now={new Date("2026-12-18T23:00:00Z")}
      />,
    );
    expect(screen.getByRole("link", { name: "Order to your table" })).toHaveAttribute(
      "href",
      "/order",
    );
    if (attendance === "yes")
      expect(screen.getByText(/Your pass will be available here/)).toBeVisible();
    if (attendance === "no")
      expect(screen.getByRole("heading", { name: "We’ll miss you" })).toBeVisible();
    expect(screen.getByRole("form", { name: "Your reply" })).toBeVisible();
  },
);
