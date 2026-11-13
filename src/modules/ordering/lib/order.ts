import { z } from "zod";
import { tableNumberSchema } from "./table-selection";

import { ORDER_NOTE_MAX, ORDER_MAX_LINES } from "./order-contract";
export * from "./order-contract";

/** Plain text: control characters become spaces, so a note can never carry markup or line tricks. */
export const orderNoteSchema = z
  .string()
  .transform((note) =>
    note
      .replace(/[\p{Cc}\p{Cf}]+/gu, " ")
      .replace(/\s+/g, " ")
      .trim(),
  )
  .pipe(z.string().max(ORDER_NOTE_MAX));

export const orderSubmissionSchema = z
  .strictObject({
    clientRequestId: z.uuid(),
    table: z.union([z.number().int(), z.string()]).transform(String).pipe(tableNumberSchema),
    items: z
      .array(z.strictObject({ menuItemId: z.uuid(), quantity: z.number().int().min(1).max(100) }))
      .min(1)
      .max(ORDER_MAX_LINES),
    note: orderNoteSchema.default(""),
  })
  .refine(
    (order) => new Set(order.items.map((item) => item.menuItemId)).size === order.items.length,
    { path: ["items"], message: "duplicate item" },
  );
export type OrderSubmission = z.infer<typeof orderSubmissionSchema>;

/** Order-independent fingerprint used to tell a true retry from a reused key with a different order. */
export function orderFingerprint(order: {
  tableNumber: number;
  note: string;
  items: readonly { menuItemId: string; quantity: number }[];
}): string {
  const items = [...order.items]
    .sort((a, b) => a.menuItemId.localeCompare(b.menuItemId))
    .map((item) => item.menuItemId + ":" + item.quantity);
  return JSON.stringify([order.tableNumber, order.note, items]);
}
