import { getGateConflictsResponse } from "@/modules/checkin/server/gate-conflicts";
export async function GET() {
  return getGateConflictsResponse();
}
