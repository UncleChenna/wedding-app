// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { InvitationView } from "../components/invitation-view";

vi.mock("../assets/celebration.webp", () => ({
  default: {
    src: "/test-photo.webp",
    width: 1800,
    height: 1200,
    blurDataURL: "data:image/webp;base64,UklGRg==",
  },
}));

it("renders provided event details and an explicit non-submitting RSVP handoff", () => {
  render(
    <InvitationView
      details={{
        names: ["Ada", "Chidi"],
        date: "Saturday, 12 June 2027",
        time: "3 pm",
        venue: "Sample Garden",
        address: "London",
        dressCode: "Garden formal",
      }}
    />,
  );
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Ada");
  expect(screen.getByText(/Saturday, 12 June 2027/)).toBeVisible();
  expect(screen.getByRole("link", { name: "View the venue" })).toHaveAttribute(
    "href",
    "https://www.google.com/maps/search/?api=1&query=Sample%20Garden%2C%20London",
  );
  expect(screen.getByRole("link", { name: "About your RSVP" })).toHaveAttribute("href", "#rsvp");
  expect(screen.getByText(/This preview does not send an RSVP/)).toBeVisible();
});
