import "server-only";
import { and, asc, eq, isNotNull, isNull } from "drizzle-orm";
import type { Db } from "@/modules/shared/server/db/client";
import { staff } from "@/modules/shared/server/db/schema";
import type { Station } from "../lib/stations";

/**
 * Who receives a station's order alerts (PRD ORD-9, TICKET-086): staff working that station who
 * opted in, have a WhatsApp number, and still have access. The sender (TICKET-085) calls this
 * per batch, so an opt-out or removed access applies to the next message.
 */
export function alertRecipients(database: Pick<Db, "select">, station: Station) {
  return database
    .select({ id: staff.id, name: staff.name, number: staff.whatsappNumber })
    .from(staff)
    .where(
      and(
        eq(staff.role, station),
        eq(staff.alertsOptIn, true),
        isNotNull(staff.whatsappNumber),
        isNull(staff.revokedAt),
      ),
    )
    .orderBy(asc(staff.name))
    .then((rows) => rows.flatMap((row) => (row.number ? [{ ...row, number: row.number }] : [])));
}
