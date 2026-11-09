import { getCredentialSnapshotResponse } from "@/modules/checkin/server/revocation-snapshot";
export async function GET() {
  return getCredentialSnapshotResponse();
}
