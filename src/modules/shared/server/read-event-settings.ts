import "server-only";

import {
  defaultEventSettings,
  eventSettingsSchema,
  type EventSettings,
} from "../lib/event-settings";

/** Only an absent row selects defaults; outages and invalid stored data remain visible errors. */
export async function readEventSettings(
  load: () => Promise<unknown | null>,
): Promise<EventSettings> {
  const row = await load();
  return eventSettingsSchema.parse(row === null ? defaultEventSettings : row);
}
