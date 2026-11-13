import {
  strictObject,
  discriminatedUnion,
  enum as enumValue,
  uuid,
  literal,
  optional,
  array,
  int,
  minimum,
  maximum,
  maxLength,
} from "zod/mini";

export const ORDER_NOTE_MAX = 140;
export const ORDER_MAX_LINES = 50;

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

export const orderResponseSchema = discriminatedUnion("status", [
  strictObject({ status: enumValue(["created", "replayed"]), orderId: uuid() }),
  strictObject({
    status: literal("rejected"),
    reason: enumValue(orderRejections),
    itemIds: optional(array(uuid()).check(maxLength(ORDER_MAX_LINES))),
    retryAfterSeconds: optional(int().check(minimum(1), maximum(86400))),
  }),
  strictObject({ status: literal("unavailable") }),
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
