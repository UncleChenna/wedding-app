import { expect, it } from "vitest";
import { assertThemeDraftsUnchanged, validateThemePublication } from "../server/theme-publication";
import { themes } from "../themes";

const light = themes.find((theme) => theme.colorScheme === "light");
const dark = themes.find((theme) => theme.colorScheme === "dark");
if (!light || !dark) throw new Error("Missing scheme fixtures");
it("validates a complete light/dark publication", () => {
  expect(validateThemePublication({ light, dark })).toEqual({ light, dark });
});
it("rejects swapping the device scheme slots", () => {
  expect(() => validateThemePublication({ light: dark, dark: light })).toThrow(/light/);
});
it("rejects invalid draft tokens before activation", () => {
  expect(() =>
    validateThemePublication({
      light: { ...light, fonts: { display: "unknown", body: "inter" } },
      dark,
    }),
  ).toThrow(/fonts.display/);
});
it("rejects a missing side of the pair", () => {
  expect(() => validateThemePublication({ light })).toThrow();
});

it("rejects another editor's saved changes before publication", () => {
  expect(() =>
    assertThemeDraftsUnchanged(
      { light: { ...light, name: "Another editor" }, dark },
      { light, dark },
    ),
  ).toThrow(/changed.*reload/i);
});
it("accepts identical reviewed tokens even with different property order", () => {
  expect(() =>
    assertThemeDraftsUnchanged(
      { light, dark },
      { dark, light: Object.fromEntries(Object.entries(light).reverse()) },
    ),
  ).not.toThrow();
});

it("treats omitted optional fields the same as undefined after JSON storage", () => {
  const reviewed = { light: { ...light, pattern: undefined }, dark };
  expect(() =>
    assertThemeDraftsUnchanged(JSON.parse(JSON.stringify(reviewed)), reviewed),
  ).not.toThrow();
});
