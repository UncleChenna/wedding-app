import { getDashboard } from "@/modules/admin/server/dashboard-handler";

export async function GET() {
  return getDashboard();
}
