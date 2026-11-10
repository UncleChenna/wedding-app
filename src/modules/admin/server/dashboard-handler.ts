import "server-only";
import { currentAdminAccess } from "./current-admin-access";
import { readDashboard } from "./dashboard-reader";
import { dashboardResponse } from "./dashboard-response";

export function getDashboard() {
  return dashboardResponse(currentAdminAccess, readDashboard);
}
