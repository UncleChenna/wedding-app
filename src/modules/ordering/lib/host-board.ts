import { z } from "zod";
import { OPEN_TICKET_STATUSES } from "./station-board";

/**
 * A table host's board (TICKET-082): open kitchen and bar tickets for the host's own tables only.
 * It never carries dietary notes; the PRD allows those for admin and kitchen only.
 */
const tableSchema = z.strictObject({ number: z.int(), name: z.string().nullable() });

export const hostTicketSchema = z.strictObject({
  id: z.uuid(),
  station: z.enum(["kitchen", "bar"]),
  status: z.enum(OPEN_TICKET_STATUSES),
  createdAt: z.iso.datetime({ offset: true }),
  table: tableSchema,
  items: z.array(z.strictObject({ name: z.string(), quantity: z.int().min(1) })).min(1),
  note: z.string().nullable(),
});
export const hostBoardSchema = z.strictObject({
  generatedAt: z.iso.datetime({ offset: true }),
  /** The tables this host looks after, lowest number first. */
  tables: z.array(tableSchema),
  tickets: z.array(hostTicketSchema),
});
export type HostTicket = z.infer<typeof hostTicketSchema>;
export type HostBoard = z.infer<typeof hostBoardSchema>;

/** Hosts only mark food or drinks as served; preparing and cancelling stay with the stations. */
export const hostServeSchema = z.strictObject({
  stationOrderId: z.uuid(),
  /** The status the host's board showed: if a station moved it first, the serve is refused. */
  from: z.enum(OPEN_TICKET_STATUSES),
});
export type HostServe = z.infer<typeof hostServeSchema>;

/** How often the host board refreshes. Hosts poll; only kitchen and bar have live topics. */
export const HOST_POLL_MS = 5_000;
