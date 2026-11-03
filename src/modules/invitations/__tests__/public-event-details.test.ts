import { expect, it, vi } from "vitest";
import { defaultEventSettings } from "@/modules/shared/lib/event-settings";
import { readPublicEventDetails } from "../server/read-public-event-details";

it("projects only public fields from current saved settings", async () => {
  const saved = {
    ...defaultEventSettings,
    coupleNames: ["Nneka", "Chidi"] as const,
    eventDate: "2027-01-02",
    venue: "The gardens",
    privateToken: "do-not-share",
  };
  const result = await readPublicEventDetails(async () => saved, vi.fn());
  expect(result).toEqual({
    coupleNames: ["Nneka", "Chidi"],
    eventDate: "2027-01-02",
    venue: "The gardens",
    ceremonyTime: null,
    timeZone: null,
  });
  expect(JSON.stringify(result)).not.toContain("do-not-share");
});

it("keeps public pages available with approved defaults during an outage without logging private errors", async () => {
  const warn = vi.fn();
  const result = await readPublicEventDetails(async () => {
    throw new Error("private connection string");
  }, warn);
  expect(result.coupleNames).toEqual(defaultEventSettings.coupleNames);
  expect(result.eventDate).toBe(defaultEventSettings.eventDate);
  expect(result.venue).toBeNull();
  expect(warn).toHaveBeenCalledExactlyOnceWith(
    "Public event details unavailable; using approved defaults",
  );
});
