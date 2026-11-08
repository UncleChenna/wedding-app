import { z } from "zod";
import { tableNumberSchema } from "./table-selection";

export const ORDER_NOTE_MAX = 140;
export const ORDER_MAX_LINES = 50;

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

export const orderRejections = [
  "invalid",
  "table-missing",
  "sold-out",
  "over-limit",
  "mismatch",
  "cooldown",
  "too-many-open",
  "closed",
] as const;
export type OrderRejection = (typeof orderRejections)[number];

export type OrderResult =
  | { status: "created" | "replayed"; orderId: string }
  | {
      status: "rejected";
      reason: OrderRejection;
      itemIds?: string[];
      /** Only for `cooldown`: whole seconds until this table may order again. */
      retryAfterSeconds?: number;
    }
  | { status: "unavailable" };

export const orderResponseSchema = z.discriminatedUnion("status", [
  z.strictObject({ status: z.enum(["created", "replayed"]), orderId: z.uuid() }),
  z.strictObject({
    status: z.literal("rejected"),
    reason: z.enum(orderRejections),
    itemIds: z.array(z.uuid()).max(ORDER_MAX_LINES).optional(),
    retryAfterSeconds: z.number().int().min(1).max(86400).optional(),
  }),
  z.strictObject({ status: z.literal("unavailable") }),
]);

export const orderCopy = {
  send: "Send order",
  sending: "Sending your order…",
  sendingButton: "Sending…",
  slow: "Still sending. The signal is slow, so we're trying again.",
  sent: "On its way. Sit back, we've got this.",
  failed: "We couldn't send your order. Check your connection, then try again.",
  retry: "Try again",
  another: "Order something else",
  emptyCart: "Choose something from the menu to start your order.",
  noteLabel: "A note for the kitchen or bar",
  noteHint: `Optional · up to ${ORDER_NOTE_MAX} characters.`,
  rejected: {
    invalid: "Something in your order didn't look right. Please check it and send again.",
    "table-missing": "We couldn't find your table. Please change your table and try again.",
    "sold-out": "Sorry, something in your order has just sold out. We've taken it out for you.",
    "over-limit": "That's more than we can send of one item at once. Please lower the quantity.",
    mismatch: "Your order changed while sending. Please check it and send again.",
    cooldown: "Your table's last order went in a moment ago. Please send this one shortly.",
    "too-many-open":
      "Your table already has a few orders on the way. Once one arrives, you can order again.",
    closed: "Ordering has paused for now. We'll open it again soon.",
  } satisfies Record<OrderRejection, string>,
} as const;

/** The cooldown message names the wait, so guests know exactly when to try again. */
export function cooldownMessage(seconds: number): string {
  return seconds <= 1
    ? "Your table's last order went in a moment ago. You can send this one in a second."
    : `Your table's last order went in a moment ago. You can send this one in ${seconds} seconds.`;
}
