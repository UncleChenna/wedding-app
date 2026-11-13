import { z } from "zod";
import { alertHealthSchema } from "./alert-health";

/** Tickets a board shows: everything not yet served or cancelled (ORD-4, ORD-5). */
export const OPEN_TICKET_STATUSES = ["received", "preparing"] as const;

const baseTicket = {
  id: z.uuid(),
  orderId: z.uuid(),
  status: z.enum(OPEN_TICKET_STATUSES),
  createdAt: z.iso.datetime({ offset: true }),
  table: z.strictObject({ number: z.int(), name: z.string().nullable() }),
  items: z.array(z.strictObject({ name: z.string(), quantity: z.int().min(1) })).min(1),
  note: z.string().nullable(),
  guestName: z.string().nullable(),
  /** Entered by a waiter from a board (TICKET-079), not from a guest's phone. */
  staffEntered: z.boolean(),
};

/** Kitchen tickets carry the table's dietary notes; the PRD allows admin and kitchen only. */
export const kitchenTicketSchema = z.strictObject({
  ...baseTicket,
  dietary: z.array(z.strictObject({ guest: z.string(), note: z.string() })),
});
/** Bar tickets never carry dietary information (TICKET-128). */
export const barTicketSchema = z.strictObject(baseTicket);

/** Served or cancelled in the last hour, newest first: collapsed under the live queue. */
export const recentTicketSchema = z.strictObject({
  id: z.uuid(),
  status: z.enum(["served", "cancelled"]),
  at: z.iso.datetime({ offset: true }),
  table: z.strictObject({ number: z.int(), name: z.string().nullable() }),
  items: z.array(z.strictObject({ name: z.string(), quantity: z.int().min(1) })),
});
export type RecentTicket = z.infer<typeof recentTicketSchema>;
export const RECENT_WINDOW_MINUTES = 60;
export const RECENT_LIMIT = 10;

export const kitchenBoardSchema = z.strictObject({
  generatedAt: z.iso.datetime({ offset: true }),
  alertHealth: alertHealthSchema.optional(),
  tickets: z.array(kitchenTicketSchema),
  recent: z.array(recentTicketSchema),
});
export const barBoardSchema = z.strictObject({
  generatedAt: z.iso.datetime({ offset: true }),
  alertHealth: alertHealthSchema.optional(),
  tickets: z.array(barTicketSchema),
  recent: z.array(recentTicketSchema),
});
export type KitchenTicket = z.infer<typeof kitchenTicketSchema>;
export type KitchenBoard = z.infer<typeof kitchenBoardSchema>;
export type BarBoard = z.infer<typeof barBoardSchema>;

/** The boards that show orders. The gate has its own screen. */
export type BoardStation = "kitchen" | "bar";
export type StationBoard = KitchenBoard | BarBoard;
export type StationTicket = KitchenTicket | BarBoard["tickets"][number];
export const boardSchemas = { kitchen: kitchenBoardSchema, bar: barBoardSchema } as const;

/** "Just now", "4 min", "1 h 5 min": short enough to read across a kitchen. */
export function ticketAge(createdAt: string, now: number): string {
  const minutes = Math.max(0, Math.floor((now - Date.parse(createdAt)) / 60_000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

/** Tickets in `next` that weren't on the board before: these flash and chime. */
export function newTicketIds(previous: readonly { id: string }[], next: readonly { id: string }[]) {
  const seen = new Set(previous.map((ticket) => ticket.id));
  return next.filter((ticket) => !seen.has(ticket.id)).map((ticket) => ticket.id);
}
