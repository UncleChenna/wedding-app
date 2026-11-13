import "server-only";
import { and, asc, eq, gt, inArray, isNotNull, isNull, lte, sql } from "drizzle-orm";
import type { Db } from "@/modules/shared/server/db/client";
import {
  eventSettings,
  orderAlerts,
  registeredDevices,
  staff,
  staffPushSubscriptions as subscriptions,
} from "@/modules/shared/server/db/schema";
import { staffEventExpiry } from "@/modules/shared/lib/staff-expiry";
import { type StaffPushSender } from "./staff-push-send";

/** Independent delivery state keeps WhatsApp drains from consuming browser pushes (and vice versa). */
export function drainStaffPush(
  database: Pick<Db, "transaction">,
  send: StaffPushSender,
  now = new Date(),
) {
  const deadline = performance.now() + 15_000;
  return database.transaction(async (tx) => {
    const pending = await tx
      .select({
        id: orderAlerts.id,
        station: orderAlerts.station,
        createdAt: orderAlerts.createdAt,
      })
      .from(orderAlerts)
      .where(eq(orderAlerts.pushStatus, "pending"))
      .orderBy(asc(orderAlerts.createdAt))
      .limit(100)
      .for("update", { skipLocked: true });
    const [settings] = await tx
      .select({ date: eventSettings.eventDate, zone: eventSettings.timeZone })
      .from(eventSettings)
      .where(eq(eventSettings.id, 1));
    const cutoff = settings ? staffEventExpiry(settings.date, settings.zone) : null;
    let sent = 0;
    let failed = 0;
    let waiting = 0;
    for (const station of ["kitchen", "bar"] as const) {
      const alerts = pending.filter((alert) => alert.station === station);
      if (!alerts.length) continue;
      const ids = alerts.map((alert) => alert.id);
      const latest = new Date(Math.max(...alerts.map((alert) => alert.createdAt.getTime())));
      const recipients =
        cutoff && cutoff > now
          ? await tx
              .select({ subscription: subscriptions })
              .from(subscriptions)
              .innerJoin(staff, eq(staff.id, subscriptions.staffId))
              .innerJoin(registeredDevices, eq(registeredDevices.id, subscriptions.deviceId))
              .where(
                and(
                  eq(subscriptions.station, station),
                  eq(staff.role, station),
                  eq(registeredDevices.role, station),
                  eq(staff.credentialVersion, subscriptions.credentialVersion),
                  isNull(staff.revokedAt),
                  isNull(registeredDevices.revokedAt),
                  isNotNull(staff.pinHash),
                  lte(staff.pinIssuedAt, now),
                  gt(staff.pinExpiresAt, now),
                  gt(subscriptions.expiresAt, now),
                  sql`${subscriptions.createdAt} <= ${latest.toISOString()}`,
                  sql`(${subscriptions.lastDeliveredAt} is null or ${subscriptions.lastDeliveredAt} < ${latest.toISOString()})`,
                ),
              )
          : [];
      let retry = false;
      let incomplete = false;
      // One generic notification per station and device, even during a burst of orders.
      // Notification tags coalesce any at-least-once retry after a database commit failure.
      for (const { subscription } of recipients) {
        // Leave unattempted work pending. Successful recipients retain a watermark,
        // so the next tick progresses instead of repeatedly sending to the first device.
        if (performance.now() + 3_000 >= deadline) {
          incomplete = true;
          break;
        }
        if (
          !cutoff ||
          cutoff.getTime() <= Date.now() ||
          subscription.expiresAt.getTime() <= Date.now()
        )
          continue;
        const result = await send(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          station,
        );
        if (result === "failed") retry = true;
        if (result === "sent")
          await tx
            .update(subscriptions)
            .set({
              lastDeliveredAt: sql`greatest(${subscriptions.lastDeliveredAt}, ${latest.toISOString()})`,
            })
            .where(
              and(
                eq(subscriptions.deviceId, subscription.deviceId),
                eq(subscriptions.endpoint, subscription.endpoint),
                eq(subscriptions.createdAt, subscription.createdAt),
              ),
            );
        if (result === "expired")
          await tx
            .delete(subscriptions)
            .where(
              and(
                eq(subscriptions.deviceId, subscription.deviceId),
                eq(subscriptions.endpoint, subscription.endpoint),
              ),
            );
      }
      if (incomplete) {
        waiting += ids.length;
        continue;
      }
      if (retry) {
        await tx
          .update(orderAlerts)
          .set({
            pushAttempts: sql`${orderAlerts.pushAttempts} + 1`,
            pushStatus: sql`case when ${orderAlerts.pushAttempts} + 1 >= 5 then 'failed'::order_alert_status else 'pending'::order_alert_status end`,
          })
          .where(inArray(orderAlerts.id, ids));
        failed += ids.length;
      } else {
        await tx
          .update(orderAlerts)
          .set({ pushStatus: "sent" })
          .where(inArray(orderAlerts.id, ids));
        sent += ids.length;
      }
    }
    return { sent, failed, waiting };
  });
}
