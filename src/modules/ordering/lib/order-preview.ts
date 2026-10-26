import { z } from "zod";

export const SAMPLE_CATEGORIES = [
  { value: "all", label: "All" },
  { value: "meals", label: "Meals" },
  { value: "soft", label: "Soft drinks" },
  { value: "alcohol", label: "Alcoholic drinks" },
] as const;
export const SAMPLE_MENU = [
  {
    id: "rice",
    name: "Jollof rice",
    category: "meals",
    description: "Tomato rice with warm spices.",
    available: true,
  },
  {
    id: "vegetables",
    name: "Grilled vegetables",
    category: "meals",
    description: "A colourful plate for the table.",
    available: true,
  },
  {
    id: "plantain",
    name: "Plantain",
    category: "meals",
    description: "Sweet, golden slices.",
    available: false,
  },
  {
    id: "water",
    name: "Still water",
    category: "soft",
    description: "A little refreshment.",
    available: true,
  },
  {
    id: "punch",
    name: "Fruit punch",
    category: "soft",
    description: "A fruity, alcohol-free glass.",
    available: true,
  },
  {
    id: "wine",
    name: "Red wine",
    category: "alcohol",
    description: "A glass for the celebration.",
    available: true,
  },
] as const;
export type SampleCategory = (typeof SAMPLE_CATEGORIES)[number]["value"];
const tableMessage = "Enter a sample table number from 1 to 30.";
export const sampleTableSchema = z
  .string()
  .trim()
  .regex(/^\d{1,2}$/, tableMessage)
  .transform(Number)
  .pipe(z.number().int().min(1, tableMessage).max(30, tableMessage));
export const orderPreviewSchema = z
  .object({
    table: z
      .number({ error: tableMessage })
      .int(tableMessage)
      .min(1, tableMessage)
      .max(30, tableMessage),
    quantities: z.record(
      z.string(),
      z
        .number()
        .int("Use whole quantities.")
        .min(0, "Quantities cannot be negative.")
        .max(10, "Choose up to 10 of each sample item."),
    ),
    note: z.string().trim().max(200, "Keep your note to 200 characters."),
  })
  .superRefine((order, context) => {
    if (!Object.values(order.quantities).some((quantity) => quantity > 0))
      context.addIssue({
        code: "custom",
        path: ["quantities"],
        message: "Choose something from the menu first.",
      });
    for (const [id, quantity] of Object.entries(order.quantities)) {
      const item = SAMPLE_MENU.find((item) => item.id === id);
      if (!item || (quantity > 0 && !item.available))
        context.addIssue({
          code: "custom",
          path: ["quantities", id],
          message: "Choose an available item from the sample menu.",
        });
    }
  });
