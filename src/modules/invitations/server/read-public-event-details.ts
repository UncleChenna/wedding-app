import "server-only";
import { defaultEventSettings } from "@/modules/shared/lib/event-settings";
import type { PublicEventDetails } from "../lib/event-summary";

/** Public display fallback only. Never use for invitation authorization, RSVP or staff settings. */
export async function readPublicEventDetails(
  load: () => Promise<PublicEventDetails>,
  warn: (message: string) => void,
): Promise<PublicEventDetails> {
  let settings: PublicEventDetails;
  try {
    settings = await load();
  } catch {
    warn("Public event details unavailable; using approved defaults");
    settings = defaultEventSettings;
  }
  return {
    coupleNames: settings.coupleNames,
    eventDate: settings.eventDate,
    ceremonyTime: settings.ceremonyTime,
    timeZone: settings.timeZone,
    venue: settings.venue,
  };
}
