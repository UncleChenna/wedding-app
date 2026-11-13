export const TICKET_STATUSES = ["received", "preparing", "served", "cancelled"] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];
