import { expect, it } from "vitest";
import { getActiveThemes } from "../index";
import { ACTIVE_THEME_IDS } from "../config";
import { defaultActiveThemes } from "../lib/default-themes";

it("matches the validated default light and dark themes exactly", () => {
  expect(defaultActiveThemes).toEqual(getActiveThemes());
  expect(defaultActiveThemes.light.id).toBe(ACTIVE_THEME_IDS.light);
  expect(defaultActiveThemes.dark.id).toBe(ACTIVE_THEME_IDS.dark);
});
