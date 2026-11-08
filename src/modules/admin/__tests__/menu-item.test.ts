import { describe, expect, it } from "vitest";
import { fieldErrors, parseMenuItemForm } from "../lib/menu-item";

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}
const valid = {
  name: "  Jollof\u0000 rice ",
  description: "Tomato rice\nwith warm spices.",
  category: "meal",
  station: "kitchen",
  maxPerOrder: "3",
  sortOrder: "10",
  dietaryTags: "Vegan, gluten-free, vegan, ",
};

describe("menu item validation", () => {
  it("accepts a complete item and normalises text and tags", () => {
    const parsed = parseMenuItemForm(form(valid));
    expect(parsed.success && parsed.data).toEqual({
      name: "Jollof rice",
      description: "Tomato rice with warm spices.",
      category: "meal",
      station: "kitchen",
      maxPerOrder: 3,
      sortOrder: 10,
      dietaryTags: ["vegan", "gluten-free"],
    });
  });

  it("refuses an item without a station, with a message on that field", () => {
    const { station: _station, ...noStation } = valid;
    for (const values of [noStation, { ...valid, station: "" }, { ...valid, station: "gate" }]) {
      const parsed = parseMenuItemForm(form(values));
      expect(parsed.success).toBe(false);
      if (!parsed.success)
        expect(fieldErrors(parsed.error)).toMatchObject({
          station: "Choose the kitchen or the bar.",
        });
    }
  });

  it.each([
    ["name", { name: "   " }, "Give the item a name."],
    ["name", { name: "x".repeat(81) }, "Keep the name to 80 characters."],
    ["category", { category: "dessert" }, "Choose a category."],
    ["maxPerOrder", { maxPerOrder: "0" }, "Allow at least 1 per order."],
    ["maxPerOrder", { maxPerOrder: "101" }, "Allow at most 100 per order."],
    ["maxPerOrder", { maxPerOrder: "2.5" }, "Use a whole number."],
    ["description", { description: "x".repeat(201) }, "Keep the description to 200 characters."],
    ["dietaryTags", { dietaryTags: "a,b,c,d,e,f,g,h,i" }, "Use at most 8 dietary tags."],
  ] as const)("reports %s problems in plain words", (field, override, message) => {
    const parsed = parseMenuItemForm(form({ ...valid, ...override }));
    expect(parsed.success).toBe(false);
    if (!parsed.success) expect(fieldErrors(parsed.error)[field]).toBe(message);
  });

  it("defaults an empty position to 0", () => {
    const parsed = parseMenuItemForm(form({ ...valid, sortOrder: "" }));
    expect(parsed.success && parsed.data.sortOrder).toBe(0);
  });
});
