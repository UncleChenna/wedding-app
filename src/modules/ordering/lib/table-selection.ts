import { z } from "zod";

export const TABLE_COOKIE = "wedding-table";
export const tableNumberSchema = z
  .string()
  .trim()
  .regex(/^[0-9]{1,10}$/)
  .transform(Number)
  .pipe(z.number().int().min(1).max(2147483647));
export type SelectedTable = { id: string; number: number };
export type TableSelection =
  | { status: "selected"; table: SelectedTable }
  | { status: "invalid" | "missing" | "unavailable"; message: string };
export type TableFormState = { status: "idle" | "error"; value: string; message?: string };

export const tableErrors = {
  invalid: "Enter the number on your table card.",
  missing: "That table isn't on our list. Check the number on your table card.",
  unavailable: "We couldn't check your table just now. Please try again or ask the team.",
  save: "We couldn't remember your table. Please try again.",
} as const;
export const tableErrorSchema = z.enum(["invalid", "missing", "unavailable", "save"]);
export type TableSearch = Promise<{
  change?: string | string[];
  error?: string | string[];
  table?: string | string[];
}>;
