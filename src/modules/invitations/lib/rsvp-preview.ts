import { z } from "zod";

/** Sample rules only. Production allowances and menus must come from the invitation. */
export const SAMPLE_COMPANION_LIMIT = 2;
export const SAMPLE_MEALS = [
  { value: "chicken", label: "Roast chicken" },
  { value: "fish", label: "Grilled fish" },
  { value: "vegetarian", label: "Vegetarian" },
] as const;
const name = z
  .string()
  .trim()
  .min(1, "Please enter a name.")
  .max(80, "Use 80 characters or fewer.");
const meal = z.enum(["chicken", "fish", "vegetarian"], { error: "Please choose a meal." });
export const rsvpPartySchema = z.object({
  name,
  meal,
  guests: z
    .array(z.object({ id: z.number().int().nonnegative(), name, meal }))
    .max(SAMPLE_COMPANION_LIMIT),
});
export interface PartyDraft {
  name: string;
  meal: string;
  guests: { id: number; name: string; meal: string }[];
}
export const sampleParty = (): PartyDraft => ({ name: "Alex Taylor", meal: "", guests: [] });
export const mealLabel = (value: string): string =>
  SAMPLE_MEALS.find((meal) => meal.value === value)?.label ?? value;
