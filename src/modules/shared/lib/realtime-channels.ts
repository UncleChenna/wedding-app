import { z } from "zod";

/**
 * Live updates for staff stations (ADR 0024, TICKET-033). Each station listens on one private
 * Broadcast topic; only the server publishes. Messages are notifications, not data: they carry
 * ids and statuses, never names or dietary notes. The client refetches details from its REST
 * endpoint, which already applies that station's projection (TICKET-128).
 */
export const STATIONS = ["gate", "kitchen", "bar"] as const;
export type Station = (typeof STATIONS)[number];

export function stationTopic(station: Station): `station:${Station}` {
  return `station:${station}`;
}

const orderChanged = z.strictObject({
  stationOrderId: z.uuid(),
  orderId: z.uuid(),
  status: z.enum(["received", "preparing", "ready", "served", "cancelled"]),
});
const checkInRecorded = z.strictObject({
  invitationId: z.uuid().nullable(),
  admitted: z.int().min(0),
  conflict: z.boolean(),
});

/** Every event a station can receive, and exactly the fields it may carry. */
export const stationEvents = {
  kitchen: { "order.changed": orderChanged },
  bar: { "order.changed": orderChanged },
  gate: { "checkin.recorded": checkInRecorded },
} as const;

export type StationEvent<S extends Station> = keyof (typeof stationEvents)[S] & string;
export type StationPayload<S extends Station, E extends StationEvent<S>> =
  (typeof stationEvents)[S][E] extends z.ZodType<infer T> ? T : never;

/** The token a station browser receives from its `/api/<station>/realtime-token` route. */
export const realtimeTokenSchema = z.strictObject({
  token: z.string().min(1),
  expiresAt: z.iso.datetime(),
});
export type RealtimeToken = z.infer<typeof realtimeTokenSchema>;
