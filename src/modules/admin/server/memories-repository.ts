import "server-only";
import { count, eq, sql } from "drizzle-orm";
import { db, type Db } from "@/modules/shared/server/db/client";
import {
  admissionCounters,
  invitations,
  menuItems,
  orderItems,
  rsvps,
  stationOrders,
} from "@/modules/shared/server/db/schema";
import { parseMemories } from "../lib/memories";

/** Internal aggregate query: authorize at the caller; never select contacts or free-form notes. */
export async function readMemories(database: Pick<Db, "transaction"> = db) {
  return database.transaction(
    async (tx) => {
      const [invited] = await tx.select({ total: count() }).from(invitations);
      const [replies] = await tx
        .select({
          yes: sql<number>`count(*) filter (where ${rsvps.attending})`.mapWith(Number),
          no: sql<number>`count(*) filter (where not ${rsvps.attending})`.mapWith(Number),
          attending: sql<number>`coalesce(sum(${rsvps.countAttending}), 0)`.mapWith(Number),
        })
        .from(rsvps);
      // Counters include accepted legacy backfill and current partial arrivals.
      // check_ins is an archive: counting it misses new scans and counts overflow.
      const [admitted] = await tx
        .select({
          total: sql<number>`coalesce(sum(${admissionCounters.admittedPeople}), 0)`.mapWith(Number),
        })
        .from(admissionCounters);
      const menu = await tx
        .select({
          name: menuItems.name,
          // Cancelled station orders never contribute to popularity or served counts.
          ordered:
            sql<number>`coalesce(sum(case when ${stationOrders.status} <> 'cancelled' then ${orderItems.quantity} else 0 end), 0)`.mapWith(
              Number,
            ),
          served:
            sql<number>`coalesce(sum(case when ${stationOrders.status} = 'served' then ${orderItems.quantity} else 0 end), 0)`.mapWith(
              Number,
            ),
        })
        .from(menuItems)
        .leftJoin(orderItems, eq(orderItems.menuItemId, menuItems.id))
        .leftJoin(stationOrders, eq(stationOrders.id, orderItems.stationOrderId))
        .groupBy(menuItems.id, menuItems.name)
        .orderBy(menuItems.name, menuItems.id);
      return parseMemories({
        invitations: invited?.total ?? 0,
        repliedYes: replies?.yes ?? 0,
        repliedNo: replies?.no ?? 0,
        attending: replies?.attending ?? 0,
        admissions: admitted?.total ?? 0,
        menu,
      });
    },
    { isolationLevel: "repeatable read", accessMode: "read only" },
  );
}
