import { z } from "zod";

/** Explicit allowlists strip unknown fields, including nested private records. Not authorization. */
export const gateGuestProjectionSchema = z.object({
  name: z.string(),
  isPrimary: z.boolean(),
});
const dietaryGuestProjectionSchema = gateGuestProjectionSchema.extend({
  dietaryNotes: z.string().nullable().optional(),
});

/** The caller must resolve the role from its live server session, never a request parameter. */
export function projectGuestForRole(role: unknown, guest: unknown) {
  if (role === "admin" || role === "kitchen") return dietaryGuestProjectionSchema.parse(guest);
  if (role === "gate") return gateGuestProjectionSchema.parse(guest);
  return null;
}

const orderInstructionProjectionSchema = z.object({
  table: z.number().int().positive(),
  items: z.array(z.object({ quantity: z.number().int().positive(), name: z.string() })),
  note: z.string().nullable().optional(),
});

/**
 * ORD-3/9 operational instructions deliberately go to the selected kitchen/bar station.
 * `note` must come only from orders.notes, never RSVP dietary notes, histories or imports.
 * No guest fields are accepted. Station filtering and authorization remain the caller's job.
 */
export function projectOrderInstructionForRole(role: unknown, order: unknown) {
  if (role !== "admin" && role !== "kitchen" && role !== "bar") return null;
  return orderInstructionProjectionSchema.parse(order);
}
