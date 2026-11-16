// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
// Next transforms static image metadata; unit tests exercise semantics, browser tests render pixels.
vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <span role="img" aria-label={alt} />,
}));
vi.mock("../server/party-actions", () => ({ updateParty: vi.fn() }));
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
        pass={
          <section>
            <h2>Your pass</h2>
            <p>Real signed pass</p>
          </section>
        }
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
        pass={
          <section>
            <h2>Your pass</h2>
            <p>Real signed pass</p>
          </section>
        }
        details={{ ...defaultEventSettings, timeZone: "Africa/Lagos" }}
        now={new Date("2026-12-18T23:00:00Z")}
      />,
    );
    expect(screen.getByRole("link", { name: "Order to your table" })).toHaveAttribute(
      "href",
      "/order",
    );
    if (attendance === "yes") expect(screen.getByText(/Real signed pass/)).toBeVisible();
    if (attendance === "no")
      expect(screen.getByRole("heading", { name: "We’ll miss you" })).toBeVisible();
    expect(screen.getByRole("form", { name: "Your reply" })).toBeVisible();
  },
);

it("keeps the envelope and reply form around the personalised original card", () => {
  render(
    <PersonalInvitation
      invitation={{
        attendance: null,
        primaryNames: ["Guest"],
        householdName: null,
        cardNumber: 42,
        capacity: 2,
      }}
      token={"a".repeat(43)}
      repliesOpen
      details={defaultEventSettings}
    />,
  );
  expect(document.querySelector("[data-envelope]")).not.toBeNull();
  expect(screen.getByRole("form", { name: "Your reply" })).toBeVisible();
  expect(screen.getByRole("link", { name: "Download your invitation card" })).toHaveAttribute(
    "href",
    `/i/${"a".repeat(43)}/card.pdf`,
  );
  expect(screen.getByText("For Guest · Card 042")).toBeVisible();
});
