import { z } from "zod";

const count = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
/** Deliberate allowlist: the dashboard never receives guest records. */
export const dashboardSnapshotSchema = z.object({
  invited: count,
  attending: count,
  arrived: count,
  ordersOpen: count,
  ordersServed: count,
});
export type DashboardSnapshot = z.infer<typeof dashboardSnapshotSchema>;

export const dashboardMetrics = [
  { key: "invited", label: "Invitations sent", detail: "Active households, including replies" },
  { key: "attending", label: "RSVP’d yes", detail: "People expected" },
  { key: "arrived", label: "Arrived", detail: "People admitted at the gate" },
  { key: "ordersOpen", label: "Orders open", detail: "Guest orders still being prepared" },
  { key: "ordersServed", label: "Orders served", detail: "Completed guest orders" },
] as const;
