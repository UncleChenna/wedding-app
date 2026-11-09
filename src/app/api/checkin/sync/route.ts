import { postScanSync } from "@/modules/checkin/server/scan-sync";

export async function POST(request: Request) {
  return postScanSync(request);
}
