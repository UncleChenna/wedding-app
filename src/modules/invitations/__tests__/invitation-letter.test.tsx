// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { defaultEventSettings } from "@/modules/shared/lib/event-settings";
import { InvitationLetter } from "../components/invitation-letter";

it("keeps undecided details honest and links to the rendered reply", () => {
  render(
    <InvitationLetter details={defaultEventSettings} greeting="Our guest">
      <p>Reply here</p>
    </InvitationLetter>,
  );
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Uchenna & Adaora");
  expect(screen.getByText("Two stories. One ending: forever.")).toBeVisible();
  expect(screen.getByText("Saturday, 19 December 2026")).toHaveAttribute("datetime", "2026-12-19");
  expect(screen.getByText("Venue to follow")).toBeVisible();
  expect(screen.getByText("Dress code to follow")).toBeVisible();
  expect(screen.queryByRole("link", { name: "View the venue" })).toBeNull();
  expect(screen.getByRole("link", { name: "Kindly reply" })).toHaveAttribute("href", "#reply");
  expect(document.getElementById("reply")).toHaveTextContent("Reply here");
  expect(screen.queryByRole("link", { name: "Your pass" })).toBeNull();
});

it("renders configured event details independently of the computer time zone", () => {
  render(
    <InvitationLetter
      details={{
        ...defaultEventSettings,
        coupleNames: ["Ada", "Chidi"],
        eventDate: "2027-06-12",
        ceremonyTime: "15:30:00",
        timeZone: "Africa/Lagos",
        venue: "Test Garden",
        mapUrl: "https://maps.google.com/?q=Test+Garden",
        dressCode: "Garden formal",
      }}
      greeting="Our guest"
    >
      <p>Reply</p>
    </InvitationLetter>,
  );
  expect(screen.getByText("Saturday, 12 June 2027")).toBeVisible();
  expect(screen.getByText("3:30 pm · Africa/Lagos")).toBeVisible();
  expect(screen.getByRole("link", { name: "View the venue" })).toHaveAttribute(
    "href",
    "https://maps.google.com/?q=Test+Garden",
  );
  expect(screen.getByText("Garden formal")).toBeVisible();
});

it("never creates an unsafe map link", () => {
  render(
    <InvitationLetter
      details={{ ...defaultEventSettings, venue: "Garden", mapUrl: "javascript:alert(1)" }}
      greeting="Guest"
    >
      <p>Reply</p>
    </InvitationLetter>,
  );
  expect(screen.queryByRole("link", { name: "View the venue" })).toBeNull();
});

it("links to actual supplied pass content without an envelope interaction", () => {
  render(
    <InvitationLetter
      details={defaultEventSettings}
      greeting="Returning guest"
      pass={<p>Issued pass content</p>}
    >
      <p>Edit reply</p>
    </InvitationLetter>,
  );
  expect(screen.getByRole("link", { name: "Your pass" })).toHaveAttribute("href", "#pass");
  expect(document.getElementById("pass")).toHaveTextContent("Issued pass content");
});
