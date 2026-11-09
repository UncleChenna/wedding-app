import "server-only";
import { and, eq, isNotNull, isNull, ne, or } from "drizzle-orm";
import type { Db } from "@/modules/shared/server/db/client";
import { eventSettings, registeredDevices, staff } from "@/modules/shared/server/db/schema";
import { evaluateEventClosure, type EventClosureDecision } from "../lib/event-closure";

export type ClosureResult =
  | Exclude<EventClosureDecision, { status: "allowed" }>
  | { status: "closed"; staffRevoked: number; devicesRevoked: number };

/** Internal operation: requires the admin boundary. Never deletes admission or device evidence. */
export async function closeEvent(
  database: Pick<Db, "transaction">,
  confirmation: unknown,
  clock: () => Date = () => new Date(),
): Promise<ClosureResult> {
  return database.transaction(async (tx) => {
    const [settings] = await tx
      .select({ eventDate: eventSettings.eventDate, timeZone: eventSettings.timeZone })
      .from(eventSettings)
      .where(eq(eventSettings.id, 1))
      .for("update");
    if (!settings)
      return {
        status: "settings-required",
        message: "Confirm the wedding details before closing the event.",
      };
    // Sample time after waiting for the settings lock; never accept a browser-supplied clock.
    const now = clock();
    const decision = evaluateEventClosure(confirmation, settings, now);
    if (decision.status !== "allowed") return decision;
    await tx
      .update(eventSettings)
      .set({ orderingOpen: false, updatedAt: now })
      .where(and(eq(eventSettings.id, 1), eq(eventSettings.orderingOpen, true)));
    // Revocation and removal of PIN material invalidate every existing staff session.
    // No version increment is needed: revokedAt is checked independently on each request.
    const members = await tx
      .update(staff)
      .set({
        pinHash: null,
        pinIssuedAt: null,
        pinExpiresAt: null,
        revokedAt: now,
        updatedAt: now,
      })
      .where(and(ne(staff.role, "admin"), or(isNull(staff.revokedAt), isNotNull(staff.pinHash))))
      .returning({ id: staff.id });
    const devices = await tx
      .update(registeredDevices)
      .set({ revokedAt: now, updatedAt: now })
      .where(isNull(registeredDevices.revokedAt))
      .returning({ id: registeredDevices.id });
    return { status: "closed", staffRevoked: members.length, devicesRevoked: devices.length };
  });
}
