import { expect, it } from "vitest";
import { buildSeedData } from "../seed-data";
import { eventSettingsSchema } from "../../src/modules/shared/lib/event-settings";

it("seeds a valid selectable Warm voice deterministically", () => {
  const first = eventSettingsSchema.parse(buildSeedData().eventSettings);
  expect(first.invitationVoice).toBe("warm");
  expect(eventSettingsSchema.parse(buildSeedData().eventSettings)).toEqual(first);
});
