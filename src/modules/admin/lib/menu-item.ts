import { z } from "zod";

export const MENU_CATEGORY_OPTIONS = [
  { value: "meal", label: "Meal" },
  { value: "soft_drink", label: "Soft drink" },
  { value: "alcohol", label: "Alcoholic drink" },
] as const;
export const STATION_OPTIONS = [
  { value: "kitchen", label: "Kitchen" },
  { value: "bar", label: "Bar" },
] as const;

/** Plain single-line text: control and format characters become spaces. */
const text = () =>
  z.string().transform((value) =>
    value
      .replace(/[\p{Cc}\p{Cf}]+/gu, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );

/**
 * A menu item as the admin form submits it. Every order is routed by station, so an item without
 * one is refused here rather than failing at the database (TICKET-095).
 */
export const menuItemInputSchema = z.strictObject({
  name: text().pipe(
    z.string().min(1, "Give the item a name.").max(80, "Keep the name to 80 characters."),
  ),
  description: text().pipe(z.string().max(200, "Keep the description to 200 characters.")),
  category: z.enum(["meal", "soft_drink", "alcohol"], { error: "Choose a category." }),
  station: z.enum(["kitchen", "bar"], { error: "Choose the kitchen or the bar." }),
  maxPerOrder: z.coerce
    .number({ error: "Enter how many one order may include." })
    .int("Use a whole number.")
    .min(1, "Allow at least 1 per order.")
    .max(100, "Allow at most 100 per order."),
  sortOrder: z.coerce
    .number({ error: "Enter a position number." })
    .int("Use a whole number.")
    .min(-1000, "Use a position from -1000 to 1000.")
    .max(1000, "Use a position from -1000 to 1000."),
  dietaryTags: text()
    .transform((value) => [
      ...new Set(
        value
          .split(",")
          .map((tag) => tag.trim().toLowerCase())
          .filter(Boolean),
      ),
    ])
    .pipe(
      z
        .array(z.string().max(24, "Keep each dietary tag to 24 characters."))
        .max(8, "Use at most 8 dietary tags."),
    ),
});
export type MenuItemInput = z.infer<typeof menuItemInputSchema>;

export type MenuFormState =
  | { status: "idle" }
  | { status: "saved"; message: string }
  | {
      status: "error";
      message: string;
      fields?: Partial<Record<keyof MenuItemInput, string>>;
      /** What the admin typed, so the form can show it again after React resets it. */
      values?: Partial<Record<keyof MenuItemInput, string>>;
    };

/** Reads the admin form into the schema; unknown fields are ignored, missing ones fail validation. */
export function parseMenuItemForm(form: FormData) {
  const field = (name: string) => {
    const value = form.get(name);
    return typeof value === "string" ? value : undefined;
  };
  return menuItemInputSchema.safeParse({
    name: field("name") ?? "",
    description: field("description") ?? "",
    category: field("category"),
    station: field("station"),
    maxPerOrder: field("maxPerOrder"),
    sortOrder: field("sortOrder") ?? "0",
    dietaryTags: field("dietaryTags") ?? "",
  });
}

export function fieldErrors(error: z.ZodError<MenuItemInput>) {
  const fields: Partial<Record<keyof MenuItemInput, string>> = {};
  for (const issue of error.issues) {
    const key = issue.path[0] as keyof MenuItemInput | undefined;
    if (key && !fields[key]) fields[key] = issue.message;
  }
  return fields;
}

export const menuAdminCopy = {
  heading: "Menu",
  intro:
    "What guests can order from their table. Mark an item sold out and open order pages update within seconds.",
  add: "Add an item",
  save: "Save item",
  saving: "Saving…",
  saved: "Saved.",
  added: "Added to the menu.",
  removed: "Removed from the menu.",
  available: "Available",
  soldOut: "Sold out",
  markSoldOut: "Mark sold out",
  markAvailable: "Mark available",
  remove: "Remove item",
  inUse: "This item has been ordered, so it stays on record. Mark it sold out instead.",
  missing: "That item is no longer on the menu. Refresh to see the latest.",
  failed: "We couldn't save that just now. Please try again.",
  empty: "No items yet. Add the first one below.",
} as const;

const FORM_FIELDS = [
  "name",
  "description",
  "category",
  "station",
  "maxPerOrder",
  "sortOrder",
  "dietaryTags",
] as const;

/** The raw strings a rejected form submitted, bounded so a response can't echo a huge payload. */
export function submittedValues(form: FormData): Partial<Record<keyof MenuItemInput, string>> {
  const values: Partial<Record<keyof MenuItemInput, string>> = {};
  for (const field of FORM_FIELDS) {
    const value = form.get(field);
    if (typeof value === "string") values[field] = value.slice(0, 400);
  }
  return values;
}
