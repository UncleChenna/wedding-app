import { getAdminHealth } from "@/modules/admin/server/health-handler";
export async function GET() {
  return getAdminHealth();
}
