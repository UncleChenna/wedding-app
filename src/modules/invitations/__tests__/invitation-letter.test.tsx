// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { defaultEventSettings } from "@/modules/shared/lib/event-settings";
import { InvitationLetter } from "../components/invitation-letter";

it("shows the card's details, keeps undecided ones honest and links to the reply", () => {
  render(
    <InvitationLetter details={defaultEventSettings} greeting="Our guest">
      <p>Reply here</p>
    </InvitationLetter>,
  );
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Uchenna & Adaora");
  expect(screen.getByText("Two stories.").closest("p")).toHaveTextContent(
    "Two stories. One ending: forever.",
  );
  expect(screen.getByText("Saturday, 19 December 2026")).toHaveAttribute("datetime", "2026-12-19");
  expect(screen.getByText("12:00 pm")).toBeVisible();
  expect(screen.getByText("St Paul's Anglican Church, Apo Resettlement, Abuja")).toBeVisible();
  expect(screen.getByText("2:30 pm")).toBeVisible();
  expect(screen.getByText(/^Fineworld Recreational Park/)).toBeVisible();
  expect(screen.getByText("Dress code to follow")).toBeVisible();
  // No map link has been chosen yet, so none is shown.
  expect(screen.queryByRole("link", { name: /^Map to/ })).toBeNull();
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
  expect(screen.getByText("3:30 pm")).toBeVisible();
  expect(screen.getByRole("link", { name: "Map to the church" })).toHaveAttribute(
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
  expect(screen.queryByRole("link", { name: "Map to the church" })).toBeNull();
});

it("keeps unknown details explicit when settings are cleared", () => {
  render(
    <InvitationLetter
      details={{
        ...defaultEventSettings,
        venue: null,
        ceremonyTime: null,
        receptionVenue: null,
        receptionTime: "14:30",
      }}
      greeting="Guest"
    >
      <p>Reply</p>
    </InvitationLetter>,
  );
  expect(screen.getByText("Time to follow")).toBeVisible();
  expect(screen.getAllByText("Venue to follow")).toHaveLength(2);
});

it("links to the reception map only when it is a safe HTTPS link", () => {
  render(
    <InvitationLetter
      details={{
        ...defaultEventSettings,
        receptionMapUrl: "https://maps.google.com/?q=Fineworld",
      }}
      greeting="Guest"
    >
      <p>Reply</p>
    </InvitationLetter>,
  );
  expect(screen.getByRole("link", { name: "Map to the reception" })).toHaveAttribute(
    "href",
    "https://maps.google.com/?q=Fineworld",
  );
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

it("uses saved plain-text wording and preserves repeated sentences", () => {
  render(
    <InvitationLetter
      details={{
        ...defaultEventSettings,
        headline: "Join us. Join us.",
        subline: "A saved message <b>without HTML</b>",
      }}
      greeting="Our guest"
    >
      <p>Reply here</p>
    </InvitationLetter>,
  );
  expect(screen.getAllByText("Join us.")).toHaveLength(2);
  expect(screen.getByText("A saved message <b>without HTML</b>")).toBeVisible();
});
