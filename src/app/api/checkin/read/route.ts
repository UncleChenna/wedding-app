import { postScanRead } from "@/modules/checkin/server/scan-read";
export async function POST(request: Request) {
  return postScanRead(request);
}
