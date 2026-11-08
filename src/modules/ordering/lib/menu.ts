import { z } from "zod";

export const MENU_CATEGORIES = [
  { value: "meal", label: "Meals" },
  { value: "soft_drink", label: "Soft drinks" },
  { value: "alcohol", label: "Alcoholic drinks" },
] as const;
export type MenuCategory = (typeof MENU_CATEGORIES)[number]["value"];

/** Guest-safe menu fields; station routing and timestamps stay on the server. */
export type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  category: MenuCategory;
  maxPerOrder: number;
  available: boolean;
  dietaryTags: string[];
};
export type MenuSection = { category: MenuCategory; label: string; items: MenuItem[] };

/** Fixed category order; empty categories are left out. Items keep the order they arrive in. */
export function groupMenu(items: readonly MenuItem[]): MenuSection[] {
  return MENU_CATEGORIES.map(({ value, label }) => ({
    category: value,
    label,
    items: items.filter((item) => item.category === value),
  })).filter((section) => section.items.length > 0);
}

export const MENU_POLL_INTERVAL_MS = 3000;
export const menuAvailabilitySchema = z.strictObject({
  items: z.array(z.strictObject({ id: z.uuid(), available: z.boolean() })).max(500),
});
export type MenuAvailability = z.infer<typeof menuAvailabilitySchema>;

export const menuCopy = {
  heading: "What can we bring you?",
  soldOut: "Sold out",
  justSoldOut: (name: string) => `${name} has just sold out.`,
  backInStock: (name: string) => `${name} is available again.`,
  empty: "The menu isn't ready yet. Please ask the team for food or drinks.",
  unavailable: "We couldn't load the menu just now. Please refresh, or ask the team.",
} as const;
