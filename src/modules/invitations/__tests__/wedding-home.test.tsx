// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { defaultEventSettings } from "@/modules/shared/lib/event-settings";
import { WeddingHome } from "../components/wedding-home";
import { eventSummary } from "../lib/event-summary";
it("renders configured names, date and known details rather than sample copy", () => {
  const settings = {
    ...defaultEventSettings,
    coupleNames: ["Jane", "Alex"] as const,
    eventDate: "2027-06-12",
    venue: "The Garden",
    ceremonyTime: "15:30",
    receptionTime: "18:00",
    receptionVenue: "The Hall",
    timeZone: "Africa/Lagos",
  };
  render(<WeddingHome settings={settings} />);
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Jane & Alex");
  expect(screen.getByText("Saturday, 12 June 2027")).toBeVisible();
  expect(screen.getByText("The Garden")).toBeVisible();
  expect(screen.getByText("Church service · 3:30 pm")).toBeVisible();
  expect(screen.getByText("Reception · 6:00 pm")).toBeVisible();
  expect(screen.getByText("The Hall")).toBeVisible();
  expect(screen.getByRole("link", { name: "Your invitation" })).toHaveAttribute("href", "/invite");
  expect(eventSummary(settings)).toEqual({
    title: "Jane & Alex",
    date: "Saturday, 12 June 2027",
    description: "Celebrate with Jane and Alex on Saturday, 12 June 2027 at The Garden.",
  });
});
it("never links guests to internal preview pages, even in local development", () => {
  vi.stubEnv("NODE_ENV", "development");
  render(<WeddingHome settings={defaultEventSettings} />);
  vi.unstubAllEnvs();
  expect(screen.getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual([
    "tel:09160665114",
    "/invite",
  ]);
  expect(screen.queryByText(/preview/i)).toBeNull();
});
it("tells printed-card guests how and by when to RSVP", () => {
  render(<WeddingHome settings={defaultEventSettings} />);
  expect(screen.getByRole("link", { name: "09160665114" })).toHaveAttribute(
    "href",
    "tel:09160665114",
  );
  expect(screen.getByText(/by 17 December, with the card number/)).toBeVisible();
});
it("keeps unknown details explicit", () => {
  render(
    <WeddingHome
      settings={{
        ...defaultEventSettings,
        venue: null,
        ceremonyTime: null,
        receptionVenue: null,
        receptionTime: null,
        rsvpPhone: null,
      }}
    />,
  );
  expect(screen.getAllByText("Venue to follow")).toHaveLength(2);
  expect(screen.getByText("Church service")).toBeVisible();
  expect(screen.queryByText(/printed card/)).toBeNull();
});
