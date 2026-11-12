import { getPublicHealth } from "@/modules/admin/server/health-handler";
export async function GET() {
  return getPublicHealth();
}
