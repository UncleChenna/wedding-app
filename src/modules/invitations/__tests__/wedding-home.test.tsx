// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
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
    timeZone: "Africa/Lagos",
  };
  render(<WeddingHome settings={settings} />);
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Jane & Alex");
  expect(screen.getByText("Saturday, 12 June 2027")).toBeVisible();
  expect(screen.getByText("The Garden")).toBeVisible();
  expect(screen.getByText("3:30 pm · Africa/Lagos")).toBeVisible();
  expect(screen.getByRole("link", { name: "Your invitation" })).toHaveAttribute("href", "/invite");
  expect(eventSummary(settings)).toEqual({
    title: "Jane & Alex",
    date: "Saturday, 12 June 2027",
    description: "Celebrate with Jane and Alex on Saturday, 12 June 2027 at The Garden.",
  });
});
it("keeps unknown details explicit", () => {
  render(<WeddingHome settings={defaultEventSettings} />);
  expect(screen.getByText("Venue to follow")).toBeVisible();
  expect(screen.getByText("Time to follow")).toBeVisible();
});
