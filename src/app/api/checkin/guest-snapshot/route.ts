import { getGuestSnapshotResponse } from "@/modules/checkin/server/guest-snapshot";
export async function GET() {
  return getGuestSnapshotResponse();
}
