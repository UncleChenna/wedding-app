import "server-only";
import { sql } from "drizzle-orm";
import { db, type Db } from "@/modules/shared/server/db/client";
import {
  admissionCounters,
  invitations,
  orders,
  rsvps,
  stationOrders,
} from "@/modules/shared/server/db/schema";
import { dashboardSnapshotSchema } from "../lib/dashboard";

/**
 * One statement gives all totals the same PostgreSQL snapshot. Count guest orders
 * once even when split between kitchen and bar. Historical childless orders fall
 * back to their parent status; current station states override stale parent state.
 * Authorization belongs to the caller. No personal columns leave this query.
 */
export async function readDashboard(database: Pick<Db, "execute"> = db) {
  const rows = await database.execute(sql`
    with order_states as (
      select
        case when exists (select 1 from ${stationOrders} where ${stationOrders.orderId} = ${orders.id})
          then exists (select 1 from ${stationOrders} where ${stationOrders.orderId} = ${orders.id}
            and ${stationOrders.status} in ('received', 'preparing'))
          else ${orders.status} in ('received', 'preparing', 'ready') end as is_open,
        case when exists (select 1 from ${stationOrders} where ${stationOrders.orderId} = ${orders.id})
          then exists (select 1 from ${stationOrders} where ${stationOrders.orderId} = ${orders.id}
            and ${stationOrders.status} = 'served')
            and not exists (select 1 from ${stationOrders} where ${stationOrders.orderId} = ${orders.id}
              and ${stationOrders.status} in ('received', 'preparing'))
          else ${orders.status} = 'served' end as is_served
      from ${orders}
    )
    select
      (select count(*)::float8 from ${invitations} where ${invitations.status} in ('sent', 'rsvp_yes', 'rsvp_no')) as invited,
      (select coalesce(sum(${rsvps.countAttending}), 0)::float8 from ${rsvps}
        join ${invitations} on ${invitations.id} = ${rsvps.invitationId}
        where ${rsvps.attending} and ${invitations.status} = 'rsvp_yes') as attending,
      (select coalesce(sum(${admissionCounters.admittedPeople}), 0)::float8 from ${admissionCounters}) as arrived,
      (select count(*)::float8 from order_states where is_open) as "ordersOpen",
      (select count(*)::float8 from order_states where is_served) as "ordersServed"
  `);
  return dashboardSnapshotSchema.parse(rows[0]);
}
