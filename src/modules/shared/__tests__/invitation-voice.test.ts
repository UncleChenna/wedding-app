import { expect, it } from "vitest";
import { defaultEventSettings, eventSettingsSchema } from "../lib/event-settings";
it("uses Warm by default and accepts only the approved selectable voices", () => {
  expect(defaultEventSettings).toHaveProperty("invitationVoice", "warm");
  for (const invitationVoice of ["warm", "playful", "formal"])
    expect(eventSettingsSchema.parse({ ...defaultEventSettings, invitationVoice })).toHaveProperty(
      "invitationVoice",
      invitationVoice,
    );
  expect(
    eventSettingsSchema.safeParse({ ...defaultEventSettings, invitationVoice: "other" }).success,
  ).toBe(false);
});
